export interface IssueForScoring {
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'accepted' | 'dismissed';
}

/**
 * Computes compliance score:
 * Base: 100
 * High severity deduction: -15
 * Medium severity deduction: -7
 * Low severity deduction: -3
 * Dismissed issues (with reason) do not count.
 * Minimum score: 0
 */
export function computeScore(issues: IssueForScoring[]): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.status === 'dismissed') {
      continue;
    }
    if (issue.severity === 'high') {
      score -= 15;
    } else if (issue.severity === 'medium') {
      score -= 7;
    } else if (issue.severity === 'low') {
      score -= 3;
    }
  }

  return Math.max(0, score);
}

export function getScoreColor(score: number): 'green' | 'amber' | 'red' {
  if (score >= 85) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}
