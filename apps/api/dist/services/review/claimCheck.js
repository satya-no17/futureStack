"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimCheck = claimCheck;
const pg_1 = __importDefault(require("pgvector/pg"));
const db_1 = require("../../db");
const embed_1 = require("../../ai/embed");
const llm_1 = require("../../ai/llm");
const prompts_1 = require("../../ai/prompts");
const schemas_1 = require("../../ai/schemas");
/**
 * Claim verification:
 * 1. Extract factual and promotional claims.
 * 2. Retrieve top 3 fact chunks per claim from pgvector.
 * 3. Judge claims: supported, contradicted (high severity), unverifiable (medium severity).
 * 4. Verify exact character offsets in original draft.
 */
async function claimCheck(body, organizationId) {
    try {
        // 1. Extract claims
        const extractPrompt = (0, prompts_1.buildClaimExtractionPrompt)(body);
        const extraction = await (0, llm_1.llm)(extractPrompt, schemas_1.ClaimExtractionSchema, { temperature: 0.1 });
        const rawClaims = extraction.claims || [];
        if (rawClaims.length === 0) {
            return [];
        }
        // 2. Embed claims and retrieve relevant facts
        const claimEmbeddings = await (0, embed_1.embed)(rawClaims);
        const allRetrievedFacts = new Map();
        for (let i = 0; i < rawClaims.length; i++) {
            const claimVec = claimEmbeddings[i];
            const claimSql = pg_1.default.toSql(claimVec);
            const topChunks = await (0, db_1.query)(`SELECT id, content, section_ref
         FROM fact_chunks
         WHERE organization_id = $1
         ORDER BY embedding <=> $2 ASC
         LIMIT 3`, [organizationId, claimSql]);
            for (const chunk of topChunks) {
                allRetrievedFacts.set(chunk.id, chunk);
            }
        }
        const factsList = Array.from(allRetrievedFacts.values()).map((f, idx) => ({
            ...f,
            label: `[${idx + 1}]`
        }));
        // 3. Judge claims
        const judgePrompt = (0, prompts_1.buildClaimJudgePrompt)(factsList, rawClaims);
        const judged = await (0, llm_1.llm)(judgePrompt, schemas_1.ClaimJudgeResultSchema, { temperature: 0.0 });
        const issues = [];
        // 4. Process judgements
        for (const res of judged.results) {
            // Only contradicted and unverifiable become issues
            if (res.verdict === 'supported')
                continue;
            // Find exact quote in draft
            let startIdx = body.indexOf(res.claim);
            let quote = res.claim;
            if (startIdx === -1) {
                // Try case-insensitive matching
                const ciIdx = body.toLowerCase().indexOf(res.claim.toLowerCase());
                if (ciIdx !== -1) {
                    startIdx = ciIdx;
                    quote = body.substring(ciIdx, ciIdx + res.claim.length);
                }
                else {
                    // Check if claim is a substring of an actual sentence in the draft
                    const words = res.claim.split(/\s+/).slice(0, 3).join(' ');
                    const subIdx = body.toLowerCase().indexOf(words.toLowerCase());
                    if (subIdx !== -1) {
                        startIdx = subIdx;
                        quote = body.substring(subIdx, subIdx + res.claim.length);
                    }
                    else {
                        // Drop issue per reliability rules
                        continue;
                    }
                }
            }
            // Determine source reference
            let sourceRef = 'Company Approved Fact Sheet';
            if (res.fact_ref) {
                const matchedFact = factsList.find(f => f.label === res.fact_ref);
                if (matchedFact) {
                    sourceRef = matchedFact.section_ref;
                }
            }
            const issueType = res.verdict === 'contradicted' ? 'contradicted_claim' : 'unverified_claim';
            const severity = res.verdict === 'contradicted' ? 'high' : 'medium';
            issues.push({
                type: issueType,
                severity,
                quote,
                start_idx: startIdx,
                end_idx: startIdx + quote.length,
                explanation: res.reason,
                source_ref: sourceRef,
                suggestion: '',
                status: 'open'
            });
        }
        return issues;
    }
    catch (err) {
        console.error('[ClaimCheck] Error during claim check:', err);
        return [];
    }
}
