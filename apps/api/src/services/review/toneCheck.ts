import pgvector from 'pgvector/pg';
import { query } from '../../db';
import { embed } from '../../ai/embed';
import { llm } from '../../ai/llm';
import { buildToneCheckPrompt } from '../../ai/prompts';
import { ToneCheckResultSchema } from '../../ai/schemas';
import { RawIssue } from './ruleCheck';

/**
 * Performs tone check by embedding query, retrieving top 4 guideline chunks,
 * querying the LLM, and matching exact quote offsets.
 */
export async function toneCheck(
  body: string,
  organizationId: string
): Promise<RawIssue[]> {
  try {
    // 1. Embed search query for brand voice
    const queryText = 'brand voice tone style messaging rules';
    const [queryVec] = await embed([queryText]);
    const querySql = pgvector.toSql(queryVec);

    // 2. Fetch top 4 guideline chunks for this organization via cosine distance
    const chunks = await query<{ content: string; section_ref: string }>(
      `SELECT content, section_ref
       FROM guideline_chunks
       WHERE organization_id = $1
       ORDER BY embedding <=> $2 ASC
       LIMIT 4`,
      [organizationId, querySql]
    );

    if (chunks.length === 0) {
      return [];
    }

    // 3. Query LLM with prompt template
    const prompt = buildToneCheckPrompt(chunks, body);
    const parsed = await llm(prompt, ToneCheckResultSchema, { temperature: 0.1 });

    const issues: RawIssue[] = [];

    // 4. Validate exact quotes in draft to prevent hallucinations
    for (const item of parsed.results) {
      const idx = body.indexOf(item.quote);
      if (idx === -1) {
        // If not found exactly, try case-insensitive
        const lowerBody = body.toLowerCase();
        const lowerQuote = item.quote.toLowerCase();
        const ciIdx = lowerBody.indexOf(lowerQuote);
        if (ciIdx === -1) {
          // Drop issue per reliability rules
          continue;
        }
        const exactQuote = body.substring(ciIdx, ciIdx + item.quote.length);
        issues.push({
          type: 'tone',
          severity: item.severity || 'medium',
          quote: exactQuote,
          start_idx: ciIdx,
          end_idx: ciIdx + exactQuote.length,
          explanation: item.reason,
          source_ref: item.rule_ref || 'Brand Voice Guidelines',
          suggestion: '', // filled in batch explanation/fix step if needed
          status: 'open'
        });
      } else {
        issues.push({
          type: 'tone',
          severity: item.severity || 'medium',
          quote: item.quote,
          start_idx: idx,
          end_idx: idx + item.quote.length,
          explanation: item.reason,
          source_ref: item.rule_ref || 'Brand Voice Guidelines',
          suggestion: '',
          status: 'open'
        });
      }
    }

    return issues;
  } catch (err) {
    console.error('[ToneCheck] Error during tone check:', err);
    return [];
  }
}
