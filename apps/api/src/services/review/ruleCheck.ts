export interface BannedTermRecord {
  id: string;
  term: string;
  preferred_replacement: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RawIssue {
  type: 'banned_term' | 'outdated_term' | 'tone' | 'unverified_claim' | 'contradicted_claim' | 'accessibility' | 'visual';
  severity: 'high' | 'medium' | 'low';
  quote: string;
  start_idx: number;
  end_idx: number;
  explanation: string;
  source_ref: string;
  suggestion: string;
  status: 'open';
}

/**
 * Case-insensitive whole-word matching against organization banned terms list.
 * Finds exact offsets and generates replacement suggestions.
 */
export function ruleCheck(
  body: string,
  bannedTerms: BannedTermRecord[]
): RawIssue[] {
  const issues: RawIssue[] = [];

  for (const item of bannedTerms) {
    if (!item.term || !item.term.trim()) continue;

    // Escape regex special characters in term
    const escapedTerm = item.term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Whole-word boundary regex (handles punctuation borders)
    const regex = new RegExp(`(^|[^a-zA-Z0-9_])(${escapedTerm})([^a-zA-Z0-9_]|$)`, 'gi');

    let match: RegExpExecArray | null;
    while ((match = regex.exec(body)) !== null) {
      const prefix = match[1] || '';
      const matchedWord = match[2];
      const start = match.index + prefix.length;
      const end = start + matchedWord.length;

      issues.push({
        type: item.severity === 'high' ? 'banned_term' : 'outdated_term',
        severity: item.severity || 'high',
        quote: matchedWord,
        start_idx: start,
        end_idx: end,
        explanation: item.reason || `Use of "${matchedWord}" is prohibited under brand vocabulary standards.`,
        source_ref: 'Brand Vocabulary & Terminology Policy',
        suggestion: item.preferred_replacement || '',
        status: 'open'
      });

      // Avoid infinite loop on zero-length matches
      if (regex.lastIndex === match.index) {
        regex.lastIndex++;
      }
    }
  }

  return issues;
}
