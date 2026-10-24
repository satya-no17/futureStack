import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// GET /audit-logs
router.get('/', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const logs = await query(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
            u.name as actor_name, u.email as actor_email, u.role as actor_role
     FROM audit_logs a
     JOIN users u ON u.id = a.actor_id
     WHERE a.organization_id = $1
     ORDER BY a.created_at DESC
     LIMIT 100`,
    [orgId]
  );

  res.json({ logs });
});

export default router;
