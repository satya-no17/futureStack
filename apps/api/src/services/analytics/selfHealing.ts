import { query, queryOne } from '../../db';
import { llm } from '../../ai/llm';
import { z } from 'zod';
import { logAudit } from '../audit';
import { embed } from '../../ai/embed';

export interface ClarificationSuggestion {
  id?: string;
  sourceRef: string;
  ruleType: string;
  violationCount: number;
  distinctViolators: number;
  originalGuideline: string;
  suggestedRevision: string;
  dosAndDonts: { do: string; dont: string }[];
  suggestedFactUpdate?: string;
  status: 'pending' | 'accepted' | 'dismissed';
}

const ClarificationSchema = z.object({
  suggestedRevision: z.string(),
  dosAndDonts: z.array(z.object({
    do: z.string(),
    dont: z.string()
  })),
  suggestedFactUpdate: z.string().optional()
});

/**
 * Analyzes repeated violations across team members and generates self-healing
 * rule clarifications and fact sheet updates using Google Gemini with deterministic fallback.
 */
export async function generateSelfHealingSuggestions(orgId: string): Promise<ClarificationSuggestion[]> {
  // 1. Query ambiguous rules: broken by >= 2 distinct authors or >= 3 total times
  const ambiguousRules = await query<{
    source_ref: string;
    type: string;
    violation_count: string;
    distinct_violators: string;
    sample_quotes: string;
  }>(
    `SELECT i.source_ref, i.type,
            COUNT(i.id)::int as violation_count,
            COUNT(DISTINCT c.created_by)::int as distinct_violators,
            string_agg(DISTINCT i.quote, ' | ') as sample_quotes
     FROM issues i
     JOIN reviews r ON r.id = i.review_id
     JOIN content_versions cv ON cv.id = r.content_version_id
     JOIN contents c ON c.id = cv.content_id
     WHERE i.organization_id = $1
     GROUP BY i.source_ref, i.type
     HAVING COUNT(DISTINCT c.created_by) >= 2 OR COUNT(i.id) >= 3
     ORDER BY violation_count DESC
     LIMIT 5`,
    [orgId]
  );

  const suggestions: ClarificationSuggestion[] = [];

  for (const item of ambiguousRules) {
    // Check if an accepted or pending suggestion already exists
    const existing = await queryOne<{
      id: string;
      original_guideline: string;
      suggested_revision: string;
      dos_and_donts: any;
      suggested_fact_update?: string;
      status: string;
    }>(
      `SELECT id, original_guideline, suggested_revision, dos_and_donts, suggested_fact_update, status
       FROM rule_clarification_suggestions
       WHERE organization_id = $1 AND source_ref = $2
       ORDER BY created_at DESC LIMIT 1`,
      [orgId, item.source_ref]
    );

    if (existing && existing.status === 'accepted') {
      continue;
    }

    // Determine current rule description
    let originalText = `Rule: ${item.source_ref} (${item.type})`;
    const bannedMatch = await queryOne<{ term: string; preferred_replacement: string; reason: string }>(
      `SELECT term, preferred_replacement, reason FROM banned_terms WHERE term = $1 AND organization_id = $2`,
      [item.source_ref, orgId]
    );

    if (bannedMatch) {
      originalText = `Term: "${bannedMatch.term}" -> Replace with "${bannedMatch.preferred_replacement}". Reason: ${bannedMatch.reason}`;
    }

    let aiResult: z.infer<typeof ClarificationSchema>;
    try {
      const prompt = `You are a Chief Brand Governance Officer. 
A brand rule has caused confusion among writers. It has been violated ${item.violation_count} times by ${item.distinct_violators} different team members.
Current Rule: ${originalText}
Violating quotes found in drafts: ${item.sample_quotes || item.source_ref}

Please formulate a crystal-clear, unambiguous guideline revision:
1. Provide a succinct, constructive 'suggestedRevision' that clarifies the nuance so writers do not make this mistake again.
2. Provide 2 concrete 'dosAndDonts' pairings showing exact phrasing to write vs avoid.
3. If this rule involves unverified or contradicted scale/claims, recommend a 'suggestedFactUpdate' to add to company fact sheets.`;

      aiResult = await llm(prompt, ClarificationSchema);
    } catch {
      // Deterministic graceful fallback if Gemini is offline
      const safeTerm = bannedMatch?.term || item.source_ref;
      const safeReplacement = bannedMatch?.preferred_replacement || 'appropriate technical phrasing';
      aiResult = {
        suggestedRevision: `Clarification for '${safeTerm}': Writers should replace colloquial or absolute claims with precise, verifiable phrasing such as '${safeReplacement}'.`,
        dosAndDonts: [
          {
            do: `Use '${safeReplacement}' with verifiable metrics.`,
            dont: `Avoid using '${safeTerm}' in ungrounded marketing claims.`
          },
          {
            do: `Anchor claims in verified SLA and compliance documentation.`,
            dont: `Do not use superlatives without approved third-party citations.`
          }
        ],
        suggestedFactUpdate: `Acme verified spec: All public statements regarding '${safeTerm}' must reference certified audit reports.`
      };
    }

    // Persist to rule_clarification_suggestions table
    const saved = await queryOne<{ id: string }>(
      `INSERT INTO rule_clarification_suggestions (
         organization_id, source_ref, rule_type, violation_count, distinct_violators,
         original_guideline, suggested_revision, dos_and_donts, suggested_fact_update, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        orgId,
        item.source_ref,
        item.type,
        parseInt(item.violation_count, 10),
        parseInt(item.distinct_violators, 10),
        originalText,
        aiResult.suggestedRevision,
        JSON.stringify(aiResult.dosAndDonts),
        aiResult.suggestedFactUpdate || null
      ]
    );

    suggestions.push({
      id: saved?.id || existing?.id,
      sourceRef: item.source_ref,
      ruleType: item.type,
      violationCount: parseInt(item.violation_count, 10),
      distinctViolators: parseInt(item.distinct_violators, 10),
      originalGuideline: originalText,
      suggestedRevision: aiResult.suggestedRevision,
      dosAndDonts: aiResult.dosAndDonts,
      suggestedFactUpdate: aiResult.suggestedFactUpdate,
      status: 'pending'
    });
  }

  return suggestions;
}

/**
 * 1-Click apply AI-suggested rule clarification into active brand guidelines
 * and optional fact sheet update, fully updating the database and audit trail.
 */
export async function applyRuleClarification(
  orgId: string,
  userId: string,
  suggestionId: string
): Promise<{ success: boolean; message: string }> {
  const suggestion = await queryOne<{
    id: string;
    source_ref: string;
    rule_type: string;
    suggested_revision: string;
    dos_and_donts: any;
    suggested_fact_update?: string;
  }>(
    `SELECT id, source_ref, rule_type, suggested_revision, dos_and_donts, suggested_fact_update
     FROM rule_clarification_suggestions
     WHERE id = $1 AND organization_id = $2`,
    [suggestionId, orgId]
  );

  if (!suggestion) {
    throw new Error('Clarification suggestion not found');
  }

  // 1. Update banned term reason or add guideline entry
  const banned = await queryOne<{ id: string }>(
    `SELECT id FROM banned_terms WHERE term = $1 AND organization_id = $2`,
    [suggestion.source_ref, orgId]
  );

  if (banned) {
    await query(
      `UPDATE banned_terms
       SET reason = $1
       WHERE id = $2`,
      [suggestion.suggested_revision, banned.id]
    );
  }

  // 2. Insert as official Brand Guideline update
  const guideline = await queryOne<{ id: string }>(
    `INSERT INTO guidelines (organization_id, title, kind)
     VALUES ($1, $2, 'terminology')
     RETURNING id`,
    [orgId, `Self-Healed Guideline: ${suggestion.source_ref}`]
  );

  if (guideline?.id) {
    const chunkText = `${suggestion.suggested_revision}\nDo: ${suggestion.dos_and_donts?.[0]?.do || ''}\nDon't: ${suggestion.dos_and_donts?.[0]?.dont || ''}`;
    const [vector] = await embed([chunkText]);
    const vecStr = `[${vector.join(',')}]`;

    await query(
      `INSERT INTO guideline_chunks (organization_id, guideline_id, content, embedding, section_ref)
       VALUES ($1, $2, $3, $4::vector, $5)`,
      [orgId, guideline.id, chunkText, vecStr, `Rule Clarification: ${suggestion.source_ref}`]
    );
  }

  // 3. If fact update exists, add to fact_documents & fact_chunks
  if (suggestion.suggested_fact_update) {
    const factDoc = await queryOne<{ id: string }>(
      `INSERT INTO fact_documents (organization_id, title, effective_date)
       VALUES ($1, $2, CURRENT_DATE)
       RETURNING id`,
      [orgId, `Clarified Fact: ${suggestion.source_ref}`]
    );

    if (factDoc?.id) {
      const [factVec] = await embed([suggestion.suggested_fact_update]);
      const factVecStr = `[${factVec.join(',')}]`;
      await query(
        `INSERT INTO fact_chunks (organization_id, fact_document_id, content, embedding, section_ref)
         VALUES ($1, $2, $3, $4::vector, $5)`,
        [orgId, factDoc.id, suggestion.suggested_fact_update, factVecStr, `Approved Spec: ${suggestion.source_ref}`]
      );
    }
  }

  // 4. Mark suggestion as accepted
  await query(
    `UPDATE rule_clarification_suggestions
     SET status = 'accepted', accepted_by = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [userId, suggestionId]
  );

  // 5. Tamper-evident Audit Log
  await logAudit(orgId, userId, 'apply_self_healing_rule', 'rule_clarification', suggestionId, {
    sourceRef: suggestion.source_ref,
    suggestedRevision: suggestion.suggested_revision,
    factUpdated: !!suggestion.suggested_fact_update
  });

  return {
    success: true,
    message: `Guideline for '${suggestion.source_ref}' successfully updated and synchronized across vector embeddings.`
  };
}
