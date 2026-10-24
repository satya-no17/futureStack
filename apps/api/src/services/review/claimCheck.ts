import pgvector from 'pgvector/pg';
import { query } from '../../db';
import { embed } from '../../ai/embed';
import { llm } from '../../ai/llm';
import { buildClaimExtractionPrompt, buildClaimJudgePrompt } from '../../ai/prompts';
import { ClaimExtractionSchema, ClaimJudgeResultSchema } from '../../ai/schemas';
import { RawIssue } from './ruleCheck';

/**
 * Claim verification:
 * 1. Extract factual and promotional claims.
 * 2. Retrieve top 3 fact chunks per claim from pgvector.
 * 3. Judge claims: supported, contradicted (high severity), unverifiable (medium severity).
 * 4. Verify exact character offsets in original draft.
 */
export async function claimCheck(
  body: string,
  organizationId: string
): Promise<RawIssue[]> {
  try {
    // 1. Extract claims
    const extractPrompt = buildClaimExtractionPrompt(body);
    const extraction = await llm(extractPrompt, ClaimExtractionSchema, { temperature: 0.1 });
    const rawClaims = extraction.claims || [];

    if (rawClaims.length === 0) {
      return [];
    }

    // 2. Embed claims and retrieve relevant facts
    const claimEmbeddings = await embed(rawClaims);
    const allRetrievedFacts: Map<string, { id: string; content: string; section_ref: string }> = new Map();

    for (let i = 0; i < rawClaims.length; i++) {
      const claimVec = claimEmbeddings[i];
      const claimSql = pgvector.toSql(claimVec);

      const topChunks = await query<{ id: string; content: string; section_ref: string }>(
        `SELECT id, content, section_ref
         FROM fact_chunks
         WHERE organization_id = $1
         ORDER BY embedding <=> $2 ASC
         LIMIT 3`,
        [organizationId, claimSql]
      );

      for (const chunk of topChunks) {
        allRetrievedFacts.set(chunk.id, chunk);
      }
    }

    const factsList = Array.from(allRetrievedFacts.values()).map((f, idx) => ({
      ...f,
      label: `[${idx + 1}]`
    }));

    // 3. Judge claims
    const judgePrompt = buildClaimJudgePrompt(factsList, rawClaims);
    const judged = await llm(judgePrompt, ClaimJudgeResultSchema, { temperature: 0.0 });

    const issues: RawIssue[] = [];

    // 4. Process judgements
    for (const res of judged.results) {
      // Only contradicted and unverifiable become issues
      if (res.verdict === 'supported') continue;

      // Find exact quote in draft
      let startIdx = body.indexOf(res.claim);
      let quote = res.claim;

      if (startIdx === -1) {
        // Try case-insensitive matching
        const ciIdx = body.toLowerCase().indexOf(res.claim.toLowerCase());
        if (ciIdx !== -1) {
          startIdx = ciIdx;
          quote = body.substring(ciIdx, ciIdx + res.claim.length);
        } else {
          // Check if claim is a substring of an actual sentence in the draft
          const words = res.claim.split(/\s+/).slice(0, 3).join(' ');
          const subIdx = body.toLowerCase().indexOf(words.toLowerCase());
          if (subIdx !== -1) {
            startIdx = subIdx;
            quote = body.substring(subIdx, subIdx + res.claim.length);
          } else {
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
  } catch (err: any) {
    if (err?.message?.includes('AI not responded')) {
      throw err;
    }
    console.error('[ClaimCheck] Error during claim check:', err);
    return [];
  }
}
