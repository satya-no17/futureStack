export function buildClaimJudgePrompt(
  facts: { id: string; content: string; section_ref: string; label: string }[],
  claims: string[]
): string {
  const factLines = facts.map(f => `${f.label} ${f.content} (source: ${f.section_ref})`).join('\n');
  const claimLines = claims.map((c, i) => `${i + 1}. "${c}"`).join('\n');

  return `You are a brand compliance checker. Judge ONLY using the approved facts below.
If the facts do not cover the claim, answer "unverifiable". Do not use outside knowledge.

Approved facts:
${factLines || 'No approved facts provided.'}

Claims:
${claimLines}

Return ONLY valid JSON, no markdown:
{ "results": [ { "claim": "...", "verdict": "supported" | "contradicted" | "unverifiable", "fact_ref": "[1]" | null, "reason": "one sentence" } ] }`;
}

export function buildExplanationAndFixPrompt(
  quote: string,
  problem: string,
  chunk: string
): string {
  return `The author wrote: "${quote}"
Problem: ${problem}
Relevant approved text: "${chunk}"

Explain in one or two plain sentences why this is a problem.
Then rewrite ONLY the quoted part so it complies, keeping the author's meaning and tone as close as possible.
Use approved facts if they fit. Return JSON: { "explanation": "...", "suggestion": "..." }`;
}

export function buildToneCheckPrompt(
  guidelineChunks: { content: string; section_ref: string }[],
  draft: string
): string {
  const guidelinesText = guidelineChunks.map((g, i) => `[${i + 1}] (source: ${g.section_ref})\n${g.content}`).join('\n\n');

  return `You are a brand tone and voice auditor. Check the following draft against these brand voice guidelines:

Brand voice guidelines:
${guidelinesText}

Draft text to audit:
"${draft}"

Return ONLY sentences or exact phrases from the draft that clearly violate the brand voice rules. Skip borderline cases. Prefer fewer, confident findings over many noisy ones.
Return ONLY valid JSON with this exact schema:
{
  "results": [
    {
      "quote": "exact phrase from draft",
      "rule_ref": "Brand Voice, section X",
      "reason": "why this violates the tone rule",
      "severity": "high" | "medium" | "low"
    }
  ]
}`;
}

export function buildClaimExtractionPrompt(draft: string): string {
  return `You are an information extraction assistant. Extract all factual or promotional claims made in the following text.
Look for: numbers, percentages, rankings (e.g. #1, leading, fastest), guarantees, comparisons, claims of "first/best/only/trusted by", and specific product/performance claims.
Return ONLY exact short quotes from the text.
Return ONLY valid JSON:
{
  "claims": ["quote 1", "quote 2"]
}

Text:
"${draft}"`;
}
