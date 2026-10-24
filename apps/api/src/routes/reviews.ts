import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { computeScore, IssueForScoring } from '../services/review/score';
import { logAudit } from '../services/audit';

const router = Router();

// GET /reviews/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { id } = req.params;

  const review = await queryOne(
    `SELECT id, content_version_id, status, score, started_at, finished_at
     FROM reviews
     WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );

  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  const issues = await query(
    `SELECT id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status, dismiss_reason
     FROM issues
     WHERE review_id = $1 AND organization_id = $2
     ORDER BY start_idx ASC`,
    [id, orgId]
  );

  res.json({
    review,
    issues
  });
});

export default router;
