import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router({ mergeParams: true });

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) {
    res.status(404).json({ error: 'Comment or Content not found' });
    return;
  }
  next();
});

const CreateCommentSchema = z.object({
  version_id: z.string().uuid(),
  body: z.string().min(1),
  start_idx: z.number().int().optional(),
  end_idx: z.number().int().optional(),
  parent_id: z.string().uuid().optional()
});

router.post('/:id/comments', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  const contentId = req.params.id;
  const data = CreateCommentSchema.parse(req.body);

  const comment = await queryOne(
    `INSERT INTO comments (organization_id, content_id, version_id, author_id, body, start_idx, end_idx, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, body, start_idx, end_idx, parent_id, created_at`,
    [orgId, contentId, data.version_id, userId, data.body, data.start_idx || null, data.end_idx || null, data.parent_id || null]
  );

  const author = await queryOne<{ name: string; role: string }>(
    `SELECT name, role FROM users WHERE id = $1`,
    [userId]
  );

  await logAudit(orgId, userId, 'add_comment', 'comment', comment!.id, {
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

router.get('/:id/comments', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const contentId = req.params.id;

  const comments = await query(
    `SELECT cm.id, cm.body, cm.start_idx, cm.end_idx, cm.version_id, cm.parent_id, cm.created_at,
            u.name as author_name, u.role as author_role
     FROM comments cm
     JOIN users u ON u.id = cm.author_id
     WHERE cm.content_id = $1 AND cm.organization_id = $2
     ORDER BY cm.created_at ASC`,
    [contentId, orgId]
  );

  res.json({ comments });
});

export default router;
