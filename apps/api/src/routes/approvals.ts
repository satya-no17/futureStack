import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// GET /approvals/queue
router.get('/queue', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const queue = await query(
    `SELECT c.id, c.title, c.channel, c.status, c.latest_score, c.current_version_id, c.created_at,
            u.name as author_name, u.email as author_email,
            cv.version_no, cv.body as current_body,
            (SELECT COUNT(*) FROM issues i JOIN reviews r ON r.id = i.review_id WHERE r.content_version_id = c.current_version_id AND i.status = 'open' AND i.severity = 'high')::int as high_issues,
            (SELECT COUNT(*) FROM issues i JOIN reviews r ON r.id = i.review_id WHERE r.content_version_id = c.current_version_id AND i.status = 'open' AND i.severity = 'medium')::int as medium_issues,
            (SELECT COUNT(*) FROM issues i JOIN reviews r ON r.id = i.review_id WHERE r.content_version_id = c.current_version_id AND i.status = 'open' AND i.severity = 'low')::int as low_issues
     FROM contents c
     JOIN users u ON u.id = c.created_by
     LEFT JOIN content_versions cv ON cv.id = c.current_version_id
     WHERE c.organization_id = $1 AND c.status IN ('submitted', 'changes_requested')
     ORDER BY c.created_at DESC`,
    [orgId]
  );

  res.json({ queue });
});

export default router;
