"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// GET /approvals/queue
router.get('/queue', auth_1.authenticate, (0, requireRole_1.requireRole)('reviewer', 'admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const queue = await (0, db_1.query)(`SELECT c.id, c.title, c.channel, c.status, c.latest_score, c.current_version_id, c.created_at,
            u.name as author_name, u.email as author_email,
            cv.version_no, cv.body as current_body,
            (SELECT COUNT(*) FROM issues i JOIN reviews r ON r.id = i.review_id WHERE r.content_version_id = c.current_version_id AND i.status = 'open' AND i.severity = 'high')::int as high_issues,
            (SELECT COUNT(*) FROM issues i JOIN reviews r ON r.id = i.review_id WHERE r.content_version_id = c.current_version_id AND i.status = 'open' AND i.severity = 'medium')::int as medium_issues,
            (SELECT COUNT(*) FROM issues i JOIN reviews r ON r.id = i.review_id WHERE r.content_version_id = c.current_version_id AND i.status = 'open' AND i.severity = 'low')::int as low_issues
     FROM contents c
     JOIN users u ON u.id = c.created_by
     LEFT JOIN content_versions cv ON cv.id = c.current_version_id
     WHERE c.organization_id = $1 AND c.status IN ('submitted', 'changes_requested')
     ORDER BY c.created_at DESC`, [orgId]);
    res.json({ queue });
});
exports.default = router;
