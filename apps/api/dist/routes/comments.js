"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../services/audit");
const router = (0, express_1.Router)({ mergeParams: true });
const CreateCommentSchema = zod_1.z.object({
    version_id: zod_1.z.string().uuid(),
    body: zod_1.z.string().min(1),
    start_idx: zod_1.z.number().int().optional(),
    end_idx: zod_1.z.number().int().optional(),
    parent_id: zod_1.z.string().uuid().optional()
});
router.post('/:id/comments', auth_1.authenticate, async (req, res) => {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    const contentId = req.params.id;
    const data = CreateCommentSchema.parse(req.body);
    const comment = await (0, db_1.queryOne)(`INSERT INTO comments (organization_id, content_id, version_id, author_id, body, start_idx, end_idx, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, body, start_idx, end_idx, parent_id, created_at`, [orgId, contentId, data.version_id, userId, data.body, data.start_idx || null, data.end_idx || null, data.parent_id || null]);
    const author = await (0, db_1.queryOne)(`SELECT name, role FROM users WHERE id = $1`, [userId]);
    await (0, audit_1.logAudit)(orgId, userId, 'add_comment', 'comment', comment.id, {
        contentId,
        start_idx: data.start_idx,
        end_idx: data.end_idx
    });
    res.status(201).json({
        comment: {
            ...comment,
            author_name: author?.name,
            author_role: author?.role
        }
    });
});
router.get('/:id/comments', auth_1.authenticate, async (req, res) => {
    const orgId = req.user.orgId;
    const contentId = req.params.id;
    const comments = await (0, db_1.query)(`SELECT cm.id, cm.body, cm.start_idx, cm.end_idx, cm.version_id, cm.parent_id, cm.created_at,
            u.name as author_name, u.role as author_role
     FROM comments cm
     JOIN users u ON u.id = cm.author_id
     WHERE cm.content_id = $1 AND cm.organization_id = $2
     ORDER BY cm.created_at ASC`, [contentId, orgId]);
    res.json({ comments });
});
exports.default = router;
