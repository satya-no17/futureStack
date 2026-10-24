"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ruleCheck = ruleCheck;
/**
 * Case-insensitive whole-word matching against organization banned terms list.
 * Finds exact offsets and generates replacement suggestions.
 */
function ruleCheck(body, bannedTerms) {
    const issues = [];
    for (const item of bannedTerms) {
        if (!item.term || !item.term.trim())
            continue;
        // Escape regex special characters in term
        const escapedTerm = item.term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Whole-word boundary regex (handles punctuation borders)
        const regex = new RegExp(`(^|[^a-zA-Z0-9_])(${escapedTerm})([^a-zA-Z0-9_]|$)`, 'gi');
        let match;
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
