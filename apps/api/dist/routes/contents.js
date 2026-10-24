"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const review_1 = require("../services/review");
const audit_1 = require("../services/audit");
const router = (0, express_1.Router)();
const CreateContentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    channel: zod_1.z.string().min(1), // 'LinkedIn', 'Twitter / X', 'Blog', 'Email', etc.
    body: zod_1.z.string().min(1)
});
const NewVersionSchema = zod_1.z.object({
    body: zod_1.z.string().min(1)
});
const PatchIssueSchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'accepted', 'dismissed']),
    dismiss_reason: zod_1.z.string().optional()
});
const DecisionSchema = zod_1.z.object({
    decision: zod_1.z.enum(['approved', 'changes_requested', 'rejected']),
    note: zod_1.z.string().optional()
});
// 1. Create content (and version 1)
router.post('/', auth_1.authenticate, (0, requireRole_1.requireRole)('creator', 'admin'), async (req, res) => {
    const data = CreateContentSchema.parse(req.body);
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    // Insert content
    const content = await (0, db_1.queryOne)(`INSERT INTO contents (organization_id, created_by, title, channel, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING id, title, channel, status, created_at`, [orgId, userId, data.title, data.channel]);
    if (!content) {
        res.status(500).json({ error: 'Failed to create content' });
        return;
    }
    // Insert version 1
    const version = await (0, db_1.queryOne)(`INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4)
     RETURNING id, version_no, body, created_at`, [orgId, content.id, data.body, userId]);
    // Link current version
    await (0, db_1.query)(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [version.id, content.id]);
    await (0, audit_1.logAudit)(orgId, userId, 'create_content', 'content', content.id, {
        title: content.title,
        channel: content.channel
    });
    res.status(201).json({
        content: {
            ...content,
            current_version_id: version.id,
            latest_score: 100
        },
        version
    });
});
// 2. List contents
router.get('/', auth_1.authenticate, async (req, res) => {
    const orgId = req.user.orgId;
    const { role, userId } = req.user;
    let filterSql = 'WHERE c.organization_id = $1';
    const params = [orgId];
    // If creator, show their own or all org contents
    // If reviewer, show submitted, changes_requested, approved, published
    if (role === 'reviewer') {
        filterSql += ` AND c.status IN ('submitted', 'changes_requested', 'approved', 'rejected', 'published')`;
    }
    const contents = await (0, db_1.query)(`SELECT c.id, c.title, c.channel, c.status, c.latest_score, c.current_version_id, c.created_at,
            u.name as author_name, u.email as author_email,
            cv.version_no as current_version_no
     FROM contents c
     JOIN users u ON u.id = c.created_by
     LEFT JOIN content_versions cv ON cv.id = c.current_version_id
     ${filterSql}
     ORDER BY c.created_at DESC`, params);
    res.json({ contents });
});
// 3. Get single content details
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const orgId = req.user.orgId;
    const { id } = req.params;
    const content = await (0, db_1.queryOne)(`SELECT c.id, c.title, c.channel, c.status, c.latest_score, c.current_version_id, c.created_at,
            u.name as author_name, u.email as author_email, u.id as author_id
     FROM contents c
     JOIN users u ON u.id = c.created_by
     WHERE c.id = $1 AND c.organization_id = $2`, [id, orgId]);
    if (!content) {
        res.status(404).json({ error: 'Content not found' });
        return;
    }
    // Fetch all versions
    const versions = await (0, db_1.query)(`SELECT cv.id, cv.version_no, cv.body, cv.created_at, u.name as created_by_name
     FROM content_versions cv
     JOIN users u ON u.id = cv.created_by
     WHERE cv.content_id = $1 AND cv.organization_id = $2
     ORDER BY cv.version_no ASC`, [id, orgId]);
    // Fetch latest review if current_version exists
    let latestReview = null;
    let issues = [];
    if (content.current_version_id) {
        latestReview = await (0, db_1.queryOne)(`SELECT id, status, score, started_at, finished_at
       FROM reviews
       WHERE content_version_id = $1 AND organization_id = $2
       ORDER BY started_at DESC
       LIMIT 1`, [content.current_version_id, orgId]);
        if (latestReview) {
            issues = await (0, db_1.query)(`SELECT id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status, dismiss_reason
         FROM issues
         WHERE review_id = $1 AND organization_id = $2
         ORDER BY start_idx ASC`, [latestReview.id, orgId]);
        }
    }
    // Fetch comments
    const comments = await (0, db_1.query)(`SELECT cm.id, cm.body, cm.start_idx, cm.end_idx, cm.version_id, cm.parent_id, cm.created_at,
            u.name as author_name, u.role as author_role
     FROM comments cm
     JOIN users u ON u.id = cm.author_id
     WHERE cm.content_id = $1 AND cm.organization_id = $2
     ORDER BY cm.created_at ASC`, [id, orgId]);
    res.json({
        content,
        versions,
        latestReview,
        issues,
        comments
    });
});
// 4. Save a new version
router.post('/:id/versions', auth_1.authenticate, (0, requireRole_1.requireRole)('creator', 'admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    const { id } = req.params;
    const data = NewVersionSchema.parse(req.body);
    const content = await (0, db_1.queryOne)(`SELECT id, status FROM contents WHERE id = $1 AND organization_id = $2`, [id, orgId]);
    if (!content) {
        res.status(404).json({ error: 'Content not found' });
        return;
    }
    if (content.status === 'published') {
        res.status(400).json({ error: 'Cannot modify published content' });
        return;
    }
    // Get max version_no
    const maxVer = await (0, db_1.queryOne)(`SELECT COALESCE(MAX(version_no), 0) as max_no FROM content_versions WHERE content_id = $1`, [id]);
    const nextVerNo = (maxVer?.max_no || 0) + 1;
    const version = await (0, db_1.queryOne)(`INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, version_no, body, created_at`, [orgId, id, nextVerNo, data.body, userId]);
    // Update current version in content and set status back to draft if it was changes_requested
    await (0, db_1.query)(`UPDATE contents
     SET current_version_id = $1,
         status = CASE WHEN status = 'changes_requested' THEN 'draft' ELSE status END
     WHERE id = $2`, [version.id, id]);
    await (0, audit_1.logAudit)(orgId, userId, 'create_version', 'content_version', version.id, {
        contentId: id,
        versionNo: nextVerNo
    });
    res.status(201).json({ version });
});
// 5. Start a review job
router.post('/:id/review', auth_1.authenticate, (0, requireRole_1.requireRole)('creator', 'admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const { id } = req.params;
    const content = await (0, db_1.queryOne)(`SELECT id, current_version_id FROM contents WHERE id = $1 AND organization_id = $2`, [id, orgId]);
    if (!content || !content.current_version_id) {
        res.status(404).json({ error: 'Content or version not found' });
        return;
    }
    const review = await (0, db_1.queryOne)(`INSERT INTO reviews (organization_id, content_version_id, status)
     VALUES ($1, $2, 'queued')
     RETURNING id, status`, [orgId, content.current_version_id]);
    // Run pipeline asynchronously in background
    setImmediate(() => {
        (0, review_1.runReviewPipeline)(review.id, content.current_version_id, orgId).catch(err => {
            console.error('[Async Review Error]:', err);
        });
    });
    res.status(202).json({
        reviewId: review.id,
        status: 'queued',
        message: 'Review job queued'
    });
});
// 6. Submit content for approval
router.post('/:id/submit', auth_1.authenticate, (0, requireRole_1.requireRole)('creator', 'admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    const id = req.params.id;
    const content = await (0, db_1.queryOne)(`SELECT id, status, latest_score FROM contents WHERE id = $1 AND organization_id = $2`, [id, orgId]);
    if (!content) {
        res.status(404).json({ error: 'Content not found' });
        return;
    }
    // Update status to submitted
    await (0, db_1.query)(`UPDATE contents SET status = 'submitted' WHERE id = $1`, [id]);
    await (0, audit_1.logAudit)(orgId, userId, 'submit_content', 'content', id, {
        latestScore: content.latest_score
    });
    res.json({ message: 'Content submitted for approval', status: 'submitted' });
});
// 7. Decision on approval
router.post('/:id/decision', auth_1.authenticate, (0, requireRole_1.requireRole)('reviewer', 'admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    const id = req.params.id;
    const data = DecisionSchema.parse(req.body);
    if ((data.decision === 'changes_requested' || data.decision === 'rejected') && !data.note?.trim()) {
        res.status(400).json({ error: 'A reason note is required when requesting changes or rejecting' });
        return;
    }
    const content = await (0, db_1.queryOne)(`SELECT id, current_version_id FROM contents WHERE id = $1 AND organization_id = $2`, [id, orgId]);
    if (!content || !content.current_version_id) {
        res.status(404).json({ error: 'Content not found' });
        return;
    }
    // Record approval entry
    await (0, db_1.query)(`INSERT INTO approvals (organization_id, content_id, version_id, reviewer_id, decision, note)
     VALUES ($1, $2, $3, $4, $5, $6)`, [orgId, id, content.current_version_id, userId, data.decision, data.note || '']);
    // Update content status
    await (0, db_1.query)(`UPDATE contents SET status = $1 WHERE id = $2`, [data.decision, id]);
    await (0, audit_1.logAudit)(orgId, userId, `decision_${data.decision}`, 'content', id, {
        decision: data.decision,
        note: data.note
    });
    res.json({ message: `Decision recorded: ${data.decision}`, status: data.decision });
});
// 8. Publish content
router.post('/:id/publish', auth_1.authenticate, (0, requireRole_1.requireRole)('admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    const id = req.params.id;
    const content = await (0, db_1.queryOne)(`SELECT id, status FROM contents WHERE id = $1 AND organization_id = $2`, [id, orgId]);
    if (!content) {
        res.status(404).json({ error: 'Content not found' });
        return;
    }
    if (content.status !== 'approved') {
        res.status(400).json({ error: 'Only approved content can be marked as published' });
        return;
    }
    await (0, db_1.query)(`UPDATE contents SET status = 'published' WHERE id = $1`, [id]);
    await (0, audit_1.logAudit)(orgId, userId, 'publish_content', 'content', id, {});
    res.json({ message: 'Content published and locked', status: 'published' });
});
exports.default = router;
