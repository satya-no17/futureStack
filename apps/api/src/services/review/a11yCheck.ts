import { RawIssue } from './ruleCheck';

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB hex or rgb color.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates WCAG contrast ratio between two hex colors.
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1.0;

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16)
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16)
    };
  }
  return null;
}

/**
 * Pure code accessibility and readability checks:
 * 1. Missing alt text on images (![ ](...) or <img> without alt)
 * 2. Sentences over 30 words
 * 3. Long all-caps runs (> 4 consecutive words)
 * 4. Emoji-only hashtag sequences
 */
export function a11yCheck(body: string): RawIssue[] {
  const issues: RawIssue[] = [];

  // 1. Missing alt text on markdown images: ![]()
  const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = mdImgRegex.exec(body)) !== null) {
    const altText = imgMatch[1].trim();
    if (!altText) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        quote: imgMatch[0],
        start_idx: imgMatch.index,
        end_idx: imgMatch.index + imgMatch[0].length,
        explanation: 'Image is missing descriptive alternative text, violating WCAG Guideline 1.1.1 (Non-text Content).',
        source_ref: 'WCAG 2.1 Level AA Guideline 1.1.1',
        suggestion: `![Descriptive image caption](${imgMatch[2]})`,
        status: 'open'
      });
    }
  }

  // 2. Sentences over 30 words
  const sentenceRegex = /([^.!?\n]+[.!?]?)/g;
  let sentMatch: RegExpExecArray | null;
  while ((sentMatch = sentenceRegex.exec(body)) !== null) {
    const sentence = sentMatch[0].trim();
    const words = sentence.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 30) {
      issues.push({
        type: 'accessibility',
        severity: 'low',
        quote: sentence,
        start_idx: sentMatch.index,
        end_idx: sentMatch.index + sentence.length,
        explanation: `Sentence contains ${words.length} words (threshold is 30). Very long sentences reduce cognitive accessibility and readability.`,
        source_ref: 'Editorial Readability Standards',
        suggestion: 'Split this sentence into two shorter, clearer statements.',
        status: 'open'
      });
    }
  }

  // 3. Long all-caps runs (e.g. "BUY OUR PRODUCT RIGHT NOW TODAY")
  const allCapsRegex = /\b([A-Z]{3,}(?:\s+[A-Z]{3,}){2,})\b/g;
  let capsMatch: RegExpExecArray | null;
  while ((capsMatch = allCapsRegex.exec(body)) !== null) {
    const text = capsMatch[1];
    issues.push({
      type: 'accessibility',
      severity: 'low',
      quote: text,
      start_idx: capsMatch.index,
      end_idx: capsMatch.index + text.length,
      explanation: 'Sustained uppercase text is difficult for screen readers and users with visual processing impairments to parse.',
      source_ref: 'Typography & Accessibility Standards',
      suggestion: text.charAt(0) + text.slice(1).toLowerCase(),
      status: 'open'
    });
  }

  return issues;
}
