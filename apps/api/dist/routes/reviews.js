"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /reviews/:id
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const orgId = req.user.orgId;
    const { id } = req.params;
    const review = await (0, db_1.queryOne)(`SELECT id, content_version_id, status, score, started_at, finished_at
     FROM reviews
     WHERE id = $1 AND organization_id = $2`, [id, orgId]);
    if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
    }
    const issues = await (0, db_1.query)(`SELECT id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status, dismiss_reason
     FROM issues
     WHERE review_id = $1 AND organization_id = $2
     ORDER BY start_idx ASC`, [id, orgId]);
    res.json({
        review,
        issues
    });
});
exports.default = router;
