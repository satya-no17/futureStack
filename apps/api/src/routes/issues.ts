import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { computeScore, IssueForScoring } from '../services/review/score';
import { logAudit } from '../services/audit';

const router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  next();
});

const PatchIssueSchema = z.object({
  status: z.enum(['open', 'accepted', 'dismissed']),
  dismiss_reason: z.string().optional(),
  suggestion: z.string().optional()
});

router.patch('/:id', authenticate, requireRole('creator', 'admin'), async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const data = PatchIssueSchema.parse(req.body);

  const issue = await queryOne<{ id: string; review_id: string; type: string; quote: string }>(
    `SELECT id, review_id, type, quote FROM issues WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!issue) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }

  // Update issue
  const updatedIssue = await queryOne(
    `UPDATE issues
     SET status = $1,
         dismiss_reason = $2,
         suggestion = COALESCE($3, suggestion)
     WHERE id = $4
     RETURNING id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status, dismiss_reason`,
    [data.status, data.dismiss_reason || null, data.suggestion || null, id]
  );

  // Recompute score for the entire review
  const allReviewIssues = await query<IssueForScoring>(
    `SELECT severity, status FROM issues WHERE review_id = $1`,
    [issue.review_id]
  );

  const newScore = computeScore(allReviewIssues);

  // Update review score
  await query(`UPDATE reviews SET score = $1 WHERE id = $2`, [newScore, issue.review_id]);

  // Update content latest_score
  const versionInfo = await queryOne<{ content_id: string }>(
    `SELECT cv.content_id
     FROM reviews r
     JOIN content_versions cv ON cv.id = r.content_version_id
     WHERE r.id = $1`,
    [issue.review_id]
  );

  if (versionInfo) {
    await query(`UPDATE contents SET latest_score = $1 WHERE id = $2`, [newScore, versionInfo.content_id]);
  }

  await logAudit(orgId, userId, `issue_${data.status}`, 'issue', id, {
    status: data.status,
    dismissReason: data.dismiss_reason,
    newScore
  });

  res.json({
    issue: updatedIssue,
    newScore
  });
});

export default router;
