import { query, queryOne } from '../../db';
import { ruleCheck, BannedTermRecord } from './ruleCheck';
import { claimCheck } from './claimCheck';
import { a11yCheck } from './a11yCheck';
import { computeScore } from './score';

export interface SlideData {
  slideNumber: number;
  title?: string;
  body: string;
  elements?: {
    type: 'text' | 'logo' | 'image' | 'footnote';
    content?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
  }[];
}

export interface SlideIssue {
  id: string;
  slideNumber: number;
  type: 'banned_term' | 'tone' | 'unverified_claim' | 'contradicted_claim' | 'typography' | 'logo_exclusion' | 'accessibility';
  severity: 'high' | 'medium' | 'low';
  quote: string;
  explanation: string;
  suggestion: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface SlideDeckScanResult {
  assetId?: string;
  title: string;
  totalSlides: number;
  overallScore: number;
  slides: {
    slideNumber: number;
    title: string;
    body: string;
    score: number;
    issues: SlideIssue[];
  }[];
  summary: {
    totalIssues: number;
    highSeverity: number;
    claimsFlagged: number;
    typographyIssues: number;
    logoWarnings: number;
  };
}

/**
 * Scans a multi-page slide deck against organization brand rules, typography standards,
 * logo safety exclusion zones, and pgvector RAG fact chunks.
 */
export async function scanSlideDeck(
  orgId: string,
  title: string,
  slides: SlideData[]
): Promise<SlideDeckScanResult> {
  const processedSlides: SlideDeckScanResult['slides'] = [];
  let totalScoreSum = 0;
  let totalHigh = 0;
  let totalClaims = 0;
  let totalTypo = 0;
  let totalLogo = 0;

  // Pre-fetch banned terms for organization once for all slides
  const bannedTerms = await query<BannedTermRecord>(
    `SELECT id, term, preferred_replacement, reason, severity
     FROM banned_terms
     WHERE organization_id = $1`,
    [orgId]
  );

  for (const slide of slides) {
    const slideIssues: SlideIssue[] = [];
    const fullText = [slide.title, slide.body].filter(Boolean).join('\n');

    // 1. Deterministic Rule Check (Words to Avoid)
    const ruleIssues = ruleCheck(fullText, bannedTerms);
    for (const r of ruleIssues) {
      slideIssues.push({
        id: `slide-${slide.slideNumber}-rule-${Math.random().toString(36).substring(2, 7)}`,
        slideNumber: slide.slideNumber,
        type: r.type as any,
        severity: r.severity,
        quote: r.quote,
        explanation: r.explanation,
        suggestion: r.suggestion
      });
    }

    // 2. Semantic RAG Fact Verification (pgvector)
    try {
      const claimIssues = await claimCheck(fullText, orgId);
      for (const c of claimIssues) {
        slideIssues.push({
          id: `slide-${slide.slideNumber}-claim-${Math.random().toString(36).substring(2, 7)}`,
          slideNumber: slide.slideNumber,
          type: c.type as any,
          severity: c.severity,
          quote: c.quote,
          explanation: c.explanation,
          suggestion: c.suggestion
        });
        totalClaims++;
      }
    } catch (err) {
      console.warn(`[SlideScanner] Claim check skipped for slide ${slide.slideNumber}:`, err);
    }

    // 3. Accessibility & Readability Check
    const a11yIssues = a11yCheck(fullText);
    for (const a of a11yIssues) {
      slideIssues.push({
        id: `slide-${slide.slideNumber}-a11y-${Math.random().toString(36).substring(2, 7)}`,
        slideNumber: slide.slideNumber,
        type: 'accessibility',
        severity: a.severity,
        quote: a.quote,
        explanation: a.explanation,
        suggestion: a.suggestion
      });
    }

    // 4. Typography Compliance (Slide-specific layout rules)
    if (slide.title && slide.title === slide.title.toUpperCase() && slide.title.length > 15) {
      slideIssues.push({
        id: `slide-${slide.slideNumber}-typo-caps`,
        slideNumber: slide.slideNumber,
        type: 'typography',
        severity: 'medium',
        quote: slide.title,
        explanation: 'All-caps slide titles violate brand typography guidelines and harm readability.',
        suggestion: toTitleCase(slide.title)
      });
      totalTypo++;
    }

    // 5. Logo Exclusion Safety Zone Check
    if (slide.elements && slide.elements.length > 0) {
      const logos = slide.elements.filter(e => e.type === 'logo');
      const textElements = slide.elements.filter(e => e.type === 'text');

      for (const logo of logos) {
        const lx = logo.x ?? 0;
        const ly = logo.y ?? 0;
        const lw = logo.width ?? 100;
        const lh = logo.height ?? 40;

        // Check distance to edges (Safety zone minimum: 20px)
        if (lx < 20 || ly < 20) {
          slideIssues.push({
            id: `slide-${slide.slideNumber}-logo-margin`,
            slideNumber: slide.slideNumber,
            type: 'logo_exclusion',
            severity: 'medium',
            quote: 'Brand Logo placement',
            explanation: 'Logo violates the minimum 24px safety clearance from slide edges.',
            suggestion: 'Re-align logo with at least 24px padding from slide boundary.',
            boundingBox: { x: lx, y: ly, width: lw, height: lh }
          });
          totalLogo++;
        }

        // Check text crowding against logo (Exclusion perimeter)
        for (const te of textElements) {
          const tx = te.x ?? 0;
          const ty = te.y ?? 0;
          const tw = te.width ?? 200;
          const th = te.height ?? 30;

          const isOverlappingOrCrowded =
            Math.abs(lx - tx) < lw + 15 && Math.abs(ly - ty) < lh + 15;

          if (isOverlappingOrCrowded && te.content) {
            slideIssues.push({
              id: `slide-${slide.slideNumber}-logo-overlap`,
              slideNumber: slide.slideNumber,
              type: 'logo_exclusion',
              severity: 'high',
              quote: te.content.slice(0, 30),
              explanation: 'Text element violates the brand logo clearspace exclusion perimeter.',
              suggestion: 'Maintain at least 1x logo-height clearspace around all logos.',
              boundingBox: { x: tx, y: ty, width: tw, height: th }
            });
            totalLogo++;
          }
        }
      }
    }

    // Compute slide score
    const score = computeScore(slideIssues as any);
    totalScoreSum += score;
    totalHigh += slideIssues.filter(i => i.severity === 'high').length;

    processedSlides.push({
      slideNumber: slide.slideNumber,
      title: slide.title || `Slide ${slide.slideNumber}`,
      body: slide.body,
      score,
      issues: slideIssues
    });
  }

  const overallScore = Math.max(0, Math.round(totalScoreSum / Math.max(1, slides.length)));

  return {
    title,
    totalSlides: slides.length,
    overallScore,
    slides: processedSlides,
    summary: {
      totalIssues: processedSlides.reduce((acc, s) => acc + s.issues.length, 0),
      highSeverity: totalHigh,
      claimsFlagged: totalClaims,
      typographyIssues: totalTypo,
      logoWarnings: totalLogo
    }
  };
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
