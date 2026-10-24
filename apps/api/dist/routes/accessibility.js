"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const a11yCheck_1 = require("../services/review/a11yCheck");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const ContrastSchema = zod_1.z.object({
    foreground: zod_1.z.string().regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
    background: zod_1.z.string().regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
});
const AuditTextSchema = zod_1.z.object({
    text: zod_1.z.string()
});
// POST /accessibility/contrast
router.post('/contrast', auth_1.authenticate, (req, res) => {
    const data = ContrastSchema.parse(req.body);
    const ratio = (0, a11yCheck_1.calculateContrastRatio)(data.foreground, data.background);
    const passesAAANormal = ratio >= 7.0;
    const passesAANormal = ratio >= 4.5;
    const passesAALarge = ratio >= 3.0;
    res.json({
        foreground: data.foreground,
        background: data.background,
        contrastRatio: ratio,
        wcag: {
            aaNormalText: passesAANormal,
            aaLargeText: passesAALarge,
            aaaNormalText: passesAAANormal
        }
    });
});
// POST /accessibility/audit-text
router.post('/audit-text', auth_1.authenticate, (req, res) => {
    const data = AuditTextSchema.parse(req.body);
    const issues = (0, a11yCheck_1.a11yCheck)(data.text);
    res.json({ issues });
});
exports.default = router;
