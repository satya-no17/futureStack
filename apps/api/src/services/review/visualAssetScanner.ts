import { z } from 'zod';
import { llmWithMedia } from '../../ai/llm';
import { SlideData } from './slideScanner';

const VisualReviewSchema = z.object({
  pages: z.array(z.object({
    slideNumber: z.number().int().positive(),
    title: z.string().max(300).default(''),
    text: z.string().max(12000).default(''),
    findings: z.array(z.object({
      type: z.enum(['typography', 'logo_exclusion', 'visual', 'accessibility']),
      severity: z.enum(['high', 'medium', 'low']),
      quote: z.string().max(500).default(''),
      explanation: z.string().max(700),
      suggestion: z.string().max(500),
      confidence: z.number().min(0).max(1)
    })).max(12).default([])
  })).min(1).max(20)
});

export interface VisualReviewPage extends SlideData {
  visualFindings: Array<{
    type: 'typography' | 'logo_exclusion' | 'visual' | 'accessibility';
    severity: 'high' | 'medium' | 'low';
    quote: string;
    explanation: string;
    suggestion: string;
    confidence: number;
  }>;
}

export async function scanVisualAsset(buffer: Buffer, mimeType: string): Promise<VisualReviewPage[]> {
  const prompt = `Review this ${mimeType === 'application/pdf' ? 'PDF document or presentation' : 'social media image banner'} for a brand governance workspace.

Extract readable visible text in its natural reading order, separated by page. For a single image, return one page. Return no more than 20 pages. Do not invent or complete obscured words. Include claims verbatim so they can be checked against approved facts by the application.

Flag only visible, actionable concerns: text that is difficult to read due to size/contrast/density, clear logo crowding or unsafe proximity to the image edge, and clear accessibility/readability issues. Do not claim that a logo is incorrect without an approved logo reference. Do not call a factual claim false; the application will verify claims against approved brand facts. Provide a confidence from 0 to 1. Only include findings with confidence at least 0.65. Findings are review suggestions, not proof of compliance or non-compliance.

Return JSON only in this shape: {"pages":[{"slideNumber":1,"title":"short page heading","text":"all readable text","findings":[{"type":"typography|logo_exclusion|visual|accessibility","severity":"high|medium|low","quote":"visible text or logo description","explanation":"what is visibly concerning","suggestion":"specific correction","confidence":0.8}]}]}`;
  // Fields with Zod defaults may be omitted by the model but are guaranteed
  // to be present in the parsed result.
  const result = await llmWithMedia(
    prompt,
    VisualReviewSchema,
    { mimeType, data: buffer },
    { temperature: 0.1, maxTokens: 8192 }
  );
  return result.pages.map((page, index) => ({
    slideNumber: index + 1,
    title: page.title.trim() || `Page ${index + 1}`,
    body: page.text.trim(),
    visualFindings: page.findings.filter((finding) => finding.confidence >= 0.65)
  }));
}
