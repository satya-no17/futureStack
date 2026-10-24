"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeScore = computeScore;
exports.getScoreColor = getScoreColor;
/**
 * Computes compliance score:
 * Base: 100
 * High severity deduction: -15
 * Medium severity deduction: -7
 * Low severity deduction: -3
 * Dismissed issues (with reason) do not count.
 * Minimum score: 0
 */
function computeScore(issues) {
    let score = 100;
    for (const issue of issues) {
        if (issue.status === 'dismissed') {
            continue;
        }
        if (issue.severity === 'high') {
            score -= 15;
        }
        else if (issue.severity === 'medium') {
            score -= 7;
        }
        else if (issue.severity === 'low') {
            score -= 3;
        }
    }
    return Math.max(0, score);
}
function getScoreColor(score) {
    if (score >= 85)
        return 'green';
    if (score >= 60)
        return 'amber';
    return 'red';
}
