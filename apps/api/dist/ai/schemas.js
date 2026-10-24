"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimExtractionSchema = exports.ExplanationAndFixSchema = exports.ToneCheckResultSchema = exports.ClaimJudgeResultSchema = void 0;
const zod_1 = require("zod");
exports.ClaimJudgeResultSchema = zod_1.z.object({
    results: zod_1.z.array(zod_1.z.object({
        claim: zod_1.z.string(),
        verdict: zod_1.z.enum(['supported', 'contradicted', 'unverifiable']),
        fact_ref: zod_1.z.string().nullable(),
        reason: zod_1.z.string()
    }))
});
exports.ToneCheckResultSchema = zod_1.z.object({
    results: zod_1.z.array(zod_1.z.object({
        quote: zod_1.z.string(),
        rule_ref: zod_1.z.string(),
        reason: zod_1.z.string(),
        severity: zod_1.z.enum(['high', 'medium', 'low'])
    }))
});
exports.ExplanationAndFixSchema = zod_1.z.object({
    explanation: zod_1.z.string(),
    suggestion: zod_1.z.string()
});
exports.ClaimExtractionSchema = zod_1.z.object({
    claims: zod_1.z.array(zod_1.z.string())
});
