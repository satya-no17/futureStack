"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReviewPipeline = runReviewPipeline;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../db");
const ruleCheck_1 = require("./ruleCheck");
const toneCheck_1 = require("./toneCheck");
const claimCheck_1 = require("./claimCheck");
const a11yCheck_1 = require("./a11yCheck");
const score_1 = require("./score");
const llm_1 = require("../../ai/llm");
const prompts_1 = require("../../ai/prompts");
const schemas_1 = require("../../ai/schemas");
// In-memory cache for text hash to review result
const reviewCache = new Map();
/**
 * Executes full asynchronous review pipeline for a content version:
 * 1. Parallel execution: ruleCheck, toneCheck, claimCheck, a11yCheck
 * 2. Merge, deduplicate overlapping spans, sort by severity
 * 3. Batch LLM explanation & intent-preserving rewrite generation
 * 4. Compute score and persist to database
 */
async function runReviewPipeline(reviewId, contentVersionId, organizationId) {
    try {
        // 1. Mark review as running
        await (0, db_1.query)(`UPDATE reviews SET status = 'running' WHERE id = $1`, [reviewId]);
        // 2. Fetch content version and content record
        const version = await (0, db_1.queryOne)(`SELECT body, content_id FROM content_versions WHERE id = $1 AND organization_id = $2`, [contentVersionId, organizationId]);
        if (!version) {
            await (0, db_1.query)(`UPDATE reviews SET status = 'failed' WHERE id = $1`, [reviewId]);
            return;
        }
        const body = version.body;
        const bodyHash = crypto_1.default.createHash('sha256').update(`${organizationId}:${body}`).digest('hex');
        // Check cache
        if (reviewCache.has(bodyHash)) {
            const cached = reviewCache.get(bodyHash);
            for (const issue of cached.issues) {
                await (0, db_1.query)(`INSERT INTO issues (organization_id, review_id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')`, [
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
                ]);
            }
            await (0, db_1.query)(`UPDATE reviews SET status = 'done', score = $1, finished_at = CURRENT_TIMESTAMP WHERE id = $2`, [cached.score, reviewId]);
            await (0, db_1.query)(`UPDATE contents SET status = 'reviewed', latest_score = $1 WHERE id = $2`, [cached.score, version.content_id]);
            return;
        }
        // 3. Fetch banned terms for rule checker
        const bannedTerms = await (0, db_1.query)(`SELECT id, term, preferred_replacement, reason, severity
       FROM banned_terms
       WHERE organization_id = $1`, [organizationId]);
        // 4. Run checkers in parallel
        const [ruleIssues, toneIssues, claimIssues, a11yIssues] = await Promise.all([
            Promise.resolve((0, ruleCheck_1.ruleCheck)(body, bannedTerms)),
            (0, toneCheck_1.toneCheck)(body, organizationId).catch(() => []),
            (0, claimCheck_1.claimCheck)(body, organizationId).catch(() => []),
            Promise.resolve((0, a11yCheck_1.a11yCheck)(body))
        ]);
        // 5. Merge and deduplicate
        const allRaw = [...ruleIssues, ...toneIssues, ...claimIssues, ...a11yIssues];
        const deduped = deduplicateIssues(allRaw);
        // Sort by severity: high -> medium -> low
        const severityWeight = { high: 3, medium: 2, low: 1 };
        deduped.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
        // 6. Enrich issues with explanations and intent-preserving fixes
        const enrichedIssues = await Promise.all(deduped.map(async (issue) => {
            if (issue.suggestion && issue.explanation) {
                return issue;
            }
            try {
                const prompt = (0, prompts_1.buildExplanationAndFixPrompt)(issue.quote, issue.explanation || issue.type, issue.source_ref);
                const enriched = await (0, llm_1.llm)(prompt, schemas_1.ExplanationAndFixSchema, { temperature: 0.1 });
                return {
                    ...issue,
                    explanation: enriched.explanation || issue.explanation,
                    suggestion: enriched.suggestion || issue.suggestion
                };
            }
            catch {
                return issue;
            }
        }));
        // 7. Compute final compliance score
        const finalScore = (0, score_1.computeScore)(enrichedIssues);
        // 8. Persist issues to database
        for (const issue of enrichedIssues) {
            await (0, db_1.query)(`INSERT INTO issues (organization_id, review_id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')`, [
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
            ]);
        }
        // Update review status
        await (0, db_1.query)(`UPDATE reviews SET status = 'done', score = $1, finished_at = CURRENT_TIMESTAMP WHERE id = $2`, [finalScore, reviewId]);
        // Update content status & score
        await (0, db_1.query)(`UPDATE contents SET status = 'reviewed', latest_score = $1 WHERE id = $2`, [finalScore, version.content_id]);
        // Cache result
        reviewCache.set(bodyHash, { score: finalScore, issues: enrichedIssues });
    }
    catch (err) {
        console.error('[ReviewPipeline] Failed to complete review:', err);
        await (0, db_1.query)(`UPDATE reviews SET status = 'failed' WHERE id = $1`, [reviewId]);
    }
}
/**
 * Deduplicates overlapping or duplicate findings
 */
function deduplicateIssues(issues) {
    const result = [];
    for (const item of issues) {
        const isDuplicate = result.some(existing => existing.type === item.type &&
            Math.abs(existing.start_idx - item.start_idx) < 3 &&
            existing.quote.toLowerCase() === item.quote.toLowerCase());
        if (!isDuplicate) {
            result.push(item);
        }
    }
    return result;
}
