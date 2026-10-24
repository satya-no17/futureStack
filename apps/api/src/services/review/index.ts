import crypto from 'crypto';
import { query, queryOne } from '../../db';
import { ruleCheck, RawIssue, BannedTermRecord } from './ruleCheck';
import { toneCheck } from './toneCheck';
import { claimCheck } from './claimCheck';
import { a11yCheck } from './a11yCheck';
import { computeScore } from './score';
import { llm } from '../../ai/llm';
import { buildExplanationAndFixPrompt } from '../../ai/prompts';
import { ExplanationAndFixSchema } from '../../ai/schemas';

// In-memory cache for text hash to review result
const reviewCache = new Map<string, { score: number; issues: any[] }>();

/**
 * Executes full asynchronous review pipeline for a content version:
 * 1. Parallel execution: ruleCheck, toneCheck, claimCheck, a11yCheck
 * 2. Merge, deduplicate overlapping spans, sort by severity
 * 3. Batch LLM explanation & intent-preserving rewrite generation
 * 4. Compute score and persist to database
 */
export async function runReviewPipeline(
  reviewId: string,
  contentVersionId: string,
  organizationId: string
): Promise<void> {
  try {
    // 1. Mark review as running
    await query(
      `UPDATE reviews SET status = 'running' WHERE id = $1`,
      [reviewId]
    );

    // 2. Fetch content version and content record
    const version = await queryOne<{ body: string; content_id: string }>(
      `SELECT body, content_id FROM content_versions WHERE id = $1 AND organization_id = $2`,
      [contentVersionId, organizationId]
    );

    if (!version) {
      await query(`UPDATE reviews SET status = 'failed' WHERE id = $1`, [reviewId]);
      return;
    }

    const body = version.body;
    const bodyHash = crypto.createHash('sha256').update(`${organizationId}:${body}`).digest('hex');

    // Check cache
    if (reviewCache.has(bodyHash)) {
      const cached = reviewCache.get(bodyHash)!;
      for (const issue of cached.issues) {
        await query(
          `INSERT INTO issues (organization_id, review_id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')`,
          [
            organizationId,
            reviewId,
            issue.type,
            issue.severity,
            issue.quote,
            issue.start_idx,
            issue.end_idx,
            issue.explanation,
            issue.source_ref,
            issue.suggestion
          ]
        );
      }
      await query(
        `UPDATE reviews SET status = 'done', score = $1, finished_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [cached.score, reviewId]
      );
      await query(
        `UPDATE contents SET status = 'reviewed', latest_score = $1 WHERE id = $2`,
        [cached.score, version.content_id]
      );
      return;
    }

    // 3. Fetch banned terms for rule checker
    const bannedTerms = await query<BannedTermRecord>(
      `SELECT id, term, preferred_replacement, reason, severity
       FROM banned_terms
       WHERE organization_id = $1`,
      [organizationId]
    );

    // 4. Run checkers in parallel
    let aiFailed = false;
    let aiErrorMessage = '';

    const [ruleIssues, toneIssues, claimIssues, a11yIssues] = await Promise.all([
      Promise.resolve(ruleCheck(body, bannedTerms)),
      toneCheck(body, organizationId).catch(err => {
        aiFailed = true;
        aiErrorMessage = err.message || 'AI not responded';
        console.warn('[ReviewPipeline] ToneCheck AI error:', err.message);
        return [] as RawIssue[];
      }),
      claimCheck(body, organizationId).catch(err => {
        aiFailed = true;
        aiErrorMessage = err.message || 'AI not responded';
        console.warn('[ReviewPipeline] ClaimCheck AI error:', err.message);
        return [] as RawIssue[];
      }),
      Promise.resolve(a11yCheck(body))
    ]);

    // 5. Merge and deduplicate
    const allRaw: RawIssue[] = [...ruleIssues, ...toneIssues, ...claimIssues, ...a11yIssues];
    const deduped = deduplicateIssues(allRaw);

    // Sort by severity: high -> medium -> low
    const severityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    deduped.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    // 6. Enrich issues with explanations and intent-preserving fixes
    const enrichedIssues = await Promise.all(
      deduped.map(async issue => {
        if (issue.suggestion && issue.explanation) {
          return issue;
        }
        try {
          const prompt = buildExplanationAndFixPrompt(
            issue.quote,
            issue.explanation || issue.type,
            issue.source_ref
          );
          const enriched = await llm(prompt, ExplanationAndFixSchema, { temperature: 0.1 });
          return {
            ...issue,
            explanation: enriched.explanation || issue.explanation,
            suggestion: enriched.suggestion || issue.suggestion
          };
        } catch {
          aiFailed = true;
          return issue;
        }
      })
    );

    // 7. Compute final compliance score
    const finalScore = computeScore(enrichedIssues);

    // 8. Persist issues to database
    for (const issue of enrichedIssues) {
      await query(
        `INSERT INTO issues (organization_id, review_id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')`,
        [
          organizationId,
          reviewId,
          issue.type,
          issue.severity,
          issue.quote,
          issue.start_idx,
          issue.end_idx,
          issue.explanation,
          issue.source_ref,
          issue.suggestion
        ]
      );
    }

    // Update review status - if AI failed, mark as 'failed' with 'AI not responded'
    const reviewStatus = aiFailed ? 'failed' : 'done';
    const statusErrorMsg = aiFailed ? (aiErrorMessage || 'AI not responded') : null;

    await query(
      `UPDATE reviews SET status = $1, score = $2, error_message = $3, finished_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [reviewStatus, finalScore, statusErrorMsg, reviewId]
    );

    // Update content status & score
    await query(
      `UPDATE contents SET status = 'reviewed', latest_score = $1 WHERE id = $2`,
      [finalScore, version.content_id]
    );

    // Cache result if AI succeeded
    if (!aiFailed) {
      reviewCache.set(bodyHash, { score: finalScore, issues: enrichedIssues });
    }
  } catch (err: any) {
    console.error('[ReviewPipeline] Failed to complete review:', err);
    await query(
      `UPDATE reviews SET status = 'failed', error_message = $1, finished_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [err?.message || 'AI not responded', reviewId]
    );
  }
}

/**
 * Deduplicates overlapping or duplicate findings
 */
function deduplicateIssues(issues: RawIssue[]): RawIssue[] {
  const result: RawIssue[] = [];

  for (const item of issues) {
    const isDuplicate = result.some(
      existing =>
        existing.type === item.type &&
        Math.abs(existing.start_idx - item.start_idx) < 3 &&
        existing.quote.toLowerCase() === item.quote.toLowerCase()
    );

    if (!isDuplicate) {
      result.push(item);
    }
  }

  return result;
}
