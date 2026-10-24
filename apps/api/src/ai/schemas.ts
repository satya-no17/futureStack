import { z } from 'zod';

export const ClaimJudgeResultSchema = z.object({
  results: z.array(
    z.object({
      claim: z.string(),
      verdict: z.enum(['supported', 'contradicted', 'unverifiable']),
      fact_ref: z.string().nullable(),
      reason: z.string()
    })
  )
});
export type ClaimJudgeResult = z.infer<typeof ClaimJudgeResultSchema>;

export const ToneCheckResultSchema = z.object({
  results: z.array(
    z.object({
      quote: z.string(),
      rule_ref: z.string(),
      reason: z.string(),
      severity: z.enum(['high', 'medium', 'low'])
    })
  )
});
export type ToneCheckResult = z.infer<typeof ToneCheckResultSchema>;

export const ExplanationAndFixSchema = z.object({
  explanation: z.string(),
  suggestion: z.string()
});
export type ExplanationAndFix = z.infer<typeof ExplanationAndFixSchema>;

export const ClaimExtractionSchema = z.object({
  claims: z.array(z.string())
});
export type ClaimExtraction = z.infer<typeof ClaimExtractionSchema>;
