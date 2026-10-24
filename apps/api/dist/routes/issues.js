"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const score_1 = require("../services/review/score");
const audit_1 = require("../services/audit");
const router = (0, express_1.Router)();
const PatchIssueSchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'accepted', 'dismissed']),
    dismiss_reason: zod_1.z.string().optional(),
    suggestion: zod_1.z.string().optional()
});
router.patch('/:id', auth_1.authenticate, (0, requireRole_1.requireRole)('creator', 'admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    const id = req.params.id;
    const data = PatchIssueSchema.parse(req.body);
    const issue = await (0, db_1.queryOne)(`SELECT id, review_id, type, quote FROM issues WHERE id = $1 AND organization_id = $2`, [id, orgId]);
    if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
    }
    // Update issue
    const updatedIssue = await (0, db_1.queryOne)(`UPDATE issues
     SET status = $1,
         dismiss_reason = $2,
         suggestion = COALESCE($3, suggestion)
     WHERE id = $4
     RETURNING id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status, dismiss_reason`, [data.status, data.dismiss_reason || null, data.suggestion || null, id]);
    // Recompute score for the entire review
    const allReviewIssues = await (0, db_1.query)(`SELECT severity, status FROM issues WHERE review_id = $1`, [issue.review_id]);
    const newScore = (0, score_1.computeScore)(allReviewIssues);
    // Update review score
    await (0, db_1.query)(`UPDATE reviews SET score = $1 WHERE id = $2`, [newScore, issue.review_id]);
    // Update content latest_score
    const versionInfo = await (0, db_1.queryOne)(`SELECT cv.content_id
     FROM reviews r
     JOIN content_versions cv ON cv.id = r.content_version_id
     WHERE r.id = $1`, [issue.review_id]);
    if (versionInfo) {
        await (0, db_1.query)(`UPDATE contents SET latest_score = $1 WHERE id = $2`, [newScore, versionInfo.content_id]);
    }
    await (0, audit_1.logAudit)(orgId, userId, `issue_${data.status}`, 'issue', id, {
        status: data.status,
        dismissReason: data.dismiss_reason,
        newScore
    });
    res.json({
        issue: updatedIssue,
        newScore
    });
});
exports.default = router;
