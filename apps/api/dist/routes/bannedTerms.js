"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const audit_1 = require("../services/audit");
const router = (0, express_1.Router)();
const BannedTermSchema = zod_1.z.object({
    term: zod_1.z.string().min(1),
    preferred_replacement: zod_1.z.string().default(''),
    reason: zod_1.z.string().default(''),
    severity: zod_1.z.enum(['high', 'medium', 'low']).default('high')
});
router.post('/', auth_1.authenticate, (0, requireRole_1.requireRole)('admin'), async (req, res) => {
    const data = BannedTermSchema.parse(req.body);
    const orgId = req.user.orgId;
    const item = await (0, db_1.queryOne)(`INSERT INTO banned_terms (organization_id, term, preferred_replacement, reason, severity)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, term, preferred_replacement, reason, severity`, [orgId, data.term.trim(), data.preferred_replacement.trim(), data.reason.trim(), data.severity]);
    await (0, audit_1.logAudit)(orgId, req.user.userId, 'create_banned_term', 'banned_term', item.id, {
        term: data.term
    });
    res.status(201).json({ bannedTerm: item });
});
router.get('/', auth_1.authenticate, async (req, res) => {
    const orgId = req.user.orgId;
    const bannedTerms = await (0, db_1.query)(`SELECT id, term, preferred_replacement, reason, severity
     FROM banned_terms
     WHERE organization_id = $1
     ORDER BY severity DESC, term ASC`, [orgId]);
    res.json({ bannedTerms });
});
router.delete('/:id', auth_1.authenticate, (0, requireRole_1.requireRole)('admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const id = req.params.id;
    const existing = await (0, db_1.queryOne)(`DELETE FROM banned_terms WHERE id = $1 AND organization_id = $2 RETURNING id, term`, [id, orgId]);
    if (!existing) {
        res.status(404).json({ error: 'Term not found' });
        return;
    }
    await (0, audit_1.logAudit)(orgId, req.user.userId, 'delete_banned_term', 'banned_term', id, {
        term: existing.term
    });
    res.json({ message: 'Banned term deleted successfully' });
});
exports.default = router;
