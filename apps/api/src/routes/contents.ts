import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { runReviewPipeline } from '../services/review';
import { computeScore } from '../services/review/score';
import { logAudit } from '../services/audit';

const router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate UUID parameter to prevent Postgres 22P02 invalid input syntax crashes
router.param('id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }
  next();
});

const CreateContentSchema = z.object({
  title: z.string().min(1),
  channel: z.string().min(1), // 'LinkedIn', 'Twitter / X', 'Blog', 'Email', etc.
  body: z.string().min(1)
});

const NewVersionSchema = z.object({
  body: z.string().min(1)
});

const PatchIssueSchema = z.object({
  status: z.enum(['open', 'accepted', 'dismissed']),
  dismiss_reason: z.string().optional()
});

const DecisionSchema = z.object({
  decision: z.enum(['approved', 'changes_requested', 'rejected']),
  note: z.string().optional()
});

// 1. Create content (and version 1)
router.post('/', authenticate, requireRole('creator', 'admin'), async (req: Request, res: Response) => {
  const data = CreateContentSchema.parse(req.body);
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;

  // Insert content
  const content = await queryOne<{ id: string; title: string; channel: string; status: string; created_at: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING id, title, channel, status, created_at`,
    [orgId, userId, data.title, data.channel]
  );

  if (!content) {
    res.status(500).json({ error: 'Failed to create content' });
    return;
  }

  // Insert version 1
  const version = await queryOne<{ id: string; version_no: number; body: string; created_at: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4)
     RETURNING id, version_no, body, created_at`,
    [orgId, content.id, data.body, userId]
  );

  // Link current version
  await query(
    `UPDATE contents SET current_version_id = $1 WHERE id = $2`,
    [version!.id, content.id]
  );

  await logAudit(orgId, userId, 'create_content', 'content', content.id, {
    title: content.title,
    channel: content.channel
  });

  res.status(201).json({
    content: {
      ...content,
      current_version_id: version!.id,
      latest_score: 100
    },
    version
  });
});

// 2. List contents
router.get('/', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { role, userId } = req.user!;

  let filterSql = 'WHERE c.organization_id = $1';
  const params: any[] = [orgId];

  // If creator, show their own or all org contents
  // All members of the organization can view the drafts in their workspace
  const contents = await query(
    `SELECT c.id, c.title, c.channel, c.status, c.latest_score, c.current_version_id, c.created_at,
            u.name as author_name, u.email as author_email,
            cv.version_no as current_version_no
     FROM contents c
     JOIN users u ON u.id = c.created_by
     LEFT JOIN content_versions cv ON cv.id = c.current_version_id
     ${filterSql}
     ORDER BY c.created_at DESC`,
    params
  );

  res.json({ contents });
});

// 3. Get single content details
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { id } = req.params;

  const content = await queryOne(
    `SELECT c.id, c.title, c.channel, c.status, c.latest_score, c.current_version_id, c.created_at,
            u.name as author_name, u.email as author_email, u.id as author_id
     FROM contents c
     JOIN users u ON u.id = c.created_by
     WHERE c.id = $1 AND c.organization_id = $2`,
    [id, orgId]
  );

  if (!content) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  // Fetch all versions
  const versions = await query(
    `SELECT cv.id, cv.version_no, cv.body, cv.created_at, u.name as created_by_name
     FROM content_versions cv
     JOIN users u ON u.id = cv.created_by
     WHERE cv.content_id = $1 AND cv.organization_id = $2
     ORDER BY cv.version_no ASC`,
    [id, orgId]
  );

  // Fetch latest review if current_version exists
  let latestReview: any = null;
  let issues: any[] = [];

  if (content.current_version_id) {
    latestReview = await queryOne(
      `SELECT id, status, score, started_at, finished_at, error_message
       FROM reviews
       WHERE content_version_id = $1 AND organization_id = $2
       ORDER BY started_at DESC
       LIMIT 1`,
      [content.current_version_id, orgId]
    );

    if (latestReview) {
      issues = await query(
        `SELECT id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status, dismiss_reason
         FROM issues
         WHERE review_id = $1 AND organization_id = $2
         ORDER BY start_idx ASC`,
        [latestReview.id, orgId]
      );
    }
  }

  // Fetch comments
  const comments = await query(
    `SELECT cm.id, cm.body, cm.start_idx, cm.end_idx, cm.version_id, cm.parent_id, cm.created_at,
            u.name as author_name, u.role as author_role
     FROM comments cm
     JOIN users u ON u.id = cm.author_id
     WHERE cm.content_id = $1 AND cm.organization_id = $2
     ORDER BY cm.created_at ASC`,
    [id, orgId]
  );

  res.json({
    content,
    versions,
    latestReview,
    issues,
    comments
  });
});

// 4. Save a new version
router.post('/:id/versions', authenticate, requireRole('creator', 'admin'), async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  const { id } = req.params;
  const data = NewVersionSchema.parse(req.body);

  const content = await queryOne(
    `SELECT id, status FROM contents WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!content) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  if (content.status === 'published') {
    res.status(400).json({ error: 'Cannot modify published content' });
    return;
  }

  // Get max version_no
  const maxVer = await queryOne<{ max_no: number }>(
    `SELECT COALESCE(MAX(version_no), 0) as max_no FROM content_versions WHERE content_id = $1`,
    [id]
  );
  const nextVerNo = (maxVer?.max_no || 0) + 1;

  const version = await queryOne(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, version_no, body, created_at`,
    [orgId, id, nextVerNo, data.body, userId]
  );

  // Update current version in content and set status back to draft if it was changes_requested
  await query(
    `UPDATE contents
     SET current_version_id = $1,
         status = CASE WHEN status = 'changes_requested' THEN 'draft' ELSE status END
     WHERE id = $2`,
    [version!.id, id]
  );

  await logAudit(orgId, userId, 'create_version', 'content_version', version!.id, {
    contentId: id,
    versionNo: nextVerNo
  });

  res.status(201).json({ version });
});

// 5. Start a review job
router.post('/:id/review', authenticate, requireRole('creator', 'admin'), async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { id } = req.params;

  const content = await queryOne<{ id: string; current_version_id: string }>(
    `SELECT id, current_version_id FROM contents WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!content || !content.current_version_id) {
    res.status(404).json({ error: 'Content or version not found' });
    return;
  }

  const review = await queryOne<{ id: string; status: string }>(
    `INSERT INTO reviews (organization_id, content_version_id, status)
     VALUES ($1, $2, 'queued')
     RETURNING id, status`,
    [orgId, content.current_version_id]
  );

  // Run pipeline asynchronously in background
  setImmediate(() => {
    runReviewPipeline(review!.id, content.current_version_id, orgId).catch(err => {
      console.error('[Async Review Error]:', err);
    });
  });

  res.status(202).json({
    reviewId: review!.id,
    status: 'queued',
    message: 'Review job queued'
  });
});

// 6. Submit content for approval
router.post('/:id/submit', authenticate, requireRole('creator', 'admin'), async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const content = await queryOne<{ id: string; status: string; latest_score: number }>(
    `SELECT id, status, latest_score FROM contents WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!content) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  // Update status to submitted
  await query(
    `UPDATE contents SET status = 'submitted' WHERE id = $1`,
    [id]
  );

  await logAudit(orgId, userId, 'submit_content', 'content', id, {
    latestScore: content.latest_score
  });

  res.json({ message: 'Content submitted for approval', status: 'submitted' });
});

// 7. Decision on approval
router.post('/:id/decision', authenticate, requireRole('reviewer', 'admin'), async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const data = DecisionSchema.parse(req.body);

  if ((data.decision === 'changes_requested' || data.decision === 'rejected') && !data.note?.trim()) {
    res.status(400).json({ error: 'A reason note is required when requesting changes or rejecting' });
    return;
  }

  const content = await queryOne<{ id: string; current_version_id: string }>(
    `SELECT id, current_version_id FROM contents WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!content || !content.current_version_id) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  // Record approval entry
  await query(
    `INSERT INTO approvals (organization_id, content_id, version_id, reviewer_id, decision, note)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [orgId, id, content.current_version_id, userId, data.decision, data.note || '']
  );

  // Update content status
  await query(
    `UPDATE contents SET status = $1 WHERE id = $2`,
    [data.decision, id]
  );

  await logAudit(orgId, userId, `decision_${data.decision}`, 'content', id, {
    decision: data.decision,
    note: data.note
  });

  res.json({ message: `Decision recorded: ${data.decision}`, status: data.decision });
});

// 8. Publish content (Classic direct publish)
router.post('/:id/publish', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const content = await queryOne<{ id: string; status: string }>(
    `SELECT id, status FROM contents WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!content) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  if (content.status !== 'approved') {
    res.status(400).json({ error: 'Only approved content can be marked as published' });
    return;
  }

  await query(`UPDATE contents SET status = 'published' WHERE id = $1`, [id]);

  await logAudit(orgId, userId, 'publish_content', 'content', id, {});

  res.json({ message: 'Content published and locked', status: 'published' });
});

// 9. Social Preview (Zero-API: generates instant web intent links and formatted context)
router.get('/:id/social-preview', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const id = req.params.id as string;
  const includeWatermark = req.query.watermark === 'true';

  const content = await queryOne<{
    id: string;
    title: string;
    status: string;
    latest_score: number;
    current_version_id: string;
  }>(
    `SELECT id, title, status, latest_score, current_version_id FROM contents WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!content) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  const version = await queryOne<{ body: string }>(
    `SELECT body FROM content_versions WHERE id = $1`,
    [content.current_version_id]
  );

  const { getSocialPreviews } = await import('../services/publishers/socialPublisher');
  const previews = getSocialPreviews(
    content.title,
    version?.body || '',
    content.latest_score,
    includeWatermark
  );

  res.json({
    contentId: content.id,
    title: content.title,
    score: content.latest_score,
    status: content.status,
    previews
  });
});

// 10. Social Publish (Zero-API Share Intent, Clipboard Context, or Minimal-API Webhook)
router.post('/:id/social-publish', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const id = req.params.id as string;

  const { channel, method, webhookUrl, includeWatermark, targetUrl } = req.body;

  if (!channel || !method) {
    res.status(400).json({ error: 'Channel and method are required' });
    return;
  }

  const content = await queryOne<{
    id: string;
    title: string;
    channel: string;
    status: string;
    latest_score: number;
    current_version_id: string;
  }>(
    `SELECT id, title, channel, status, latest_score, current_version_id FROM contents WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!content) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  // Permissions: Admin can publish approved; Solo user can publish anytime; Creator can publish if approved
  if (content.status !== 'approved' && userRole !== 'solo') {
    res.status(400).json({ error: 'Content must be approved before publishing to social channels' });
    return;
  }

  const version = await queryOne<{ body: string }>(
    `SELECT body FROM content_versions WHERE id = $1`,
    [content.current_version_id]
  );

  const {
    formatSocialText,
    generateSocialIntentUrl,
    dispatchUniversalWebhook
  } = await import('../services/publishers/socialPublisher');

  const { formattedText, watermark } = formatSocialText(
    version?.body || '',
    channel,
    content.latest_score,
    !!includeWatermark
  );

  const intentUrl = generateSocialIntentUrl(channel, content.title, formattedText, targetUrl);

  let webhookResult: any = null;
  if (method === 'webhook') {
    if (!webhookUrl) {
      res.status(400).json({ error: 'webhookUrl is required for webhook publishing' });
      return;
    }

    const org = await queryOne<{ name: string }>(`SELECT name FROM organizations WHERE id = $1`, [orgId]);
    webhookResult = await dispatchUniversalWebhook(webhookUrl, {
      contentId: content.id,
      title: content.title,
      body: formattedText,
      channel,
      score: content.latest_score,
      publishedBy: req.user!.email,
      organizationName: org?.name
    });

    if (!webhookResult.success) {
      res.status(502).json({
        error: 'Failed to deliver to webhook',
        details: webhookResult.responseText
      });
      return;
    }
  }

  // Lock status to 'published'
  await query(`UPDATE contents SET status = 'published' WHERE id = $1`, [id]);

  // Insert publishing record
  const record = await queryOne<{ id: string; created_at: string }>(
    `INSERT INTO publishing_records (
      organization_id, content_id, version_id, published_by,
      channel, method, destination_url, payload_snapshot, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published')
    RETURNING id, created_at`,
    [
      orgId,
      id,
      content.current_version_id,
      userId,
      channel,
      method,
      method === 'webhook' ? webhookUrl : intentUrl,
      JSON.stringify({
        formattedText,
        characterCount: formattedText.length,
        score: content.latest_score,
        watermark,
        webhookResult
      })
    ]
  );

  // Tamper-evident Audit Log
  await logAudit(orgId, userId, 'social_publish', 'content', id, {
    channel,
    method,
    destination: method === 'webhook' ? webhookUrl : intentUrl,
    recordId: record?.id,
    complianceScore: content.latest_score
  });

  res.json({
    message: `Successfully published to ${channel}`,
    status: 'published',
    intentUrl,
    formattedText,
    characterCount: formattedText.length,
    recordId: record?.id
  });
});

export default router;
