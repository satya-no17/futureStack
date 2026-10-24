import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logAudit } from '../services/audit';

const router = Router();

const BannedTermSchema = z.object({
  term: z.string().min(1),
  preferred_replacement: z.string().default(''),
  reason: z.string().default(''),
  severity: z.enum(['high', 'medium', 'low']).default('high')
});

router.post('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const data = BannedTermSchema.parse(req.body);
  const orgId = req.user!.orgId;

  const item = await queryOne<{
    id: string;
    term: string;
    preferred_replacement: string;
    reason: string;
    severity: string;
  }>(
    `INSERT INTO banned_terms (organization_id, term, preferred_replacement, reason, severity)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, term, preferred_replacement, reason, severity`,
    [orgId, data.term.trim(), data.preferred_replacement.trim(), data.reason.trim(), data.severity]
  );

  await logAudit(orgId, req.user!.userId, 'create_banned_term', 'banned_term', item!.id, {
    term: data.term
  });

  res.status(201).json({ bannedTerm: item });
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const bannedTerms = await query(
    `SELECT id, term, preferred_replacement, reason, severity
     FROM banned_terms
     WHERE organization_id = $1
     ORDER BY severity DESC, term ASC`,
    [orgId]
  );

  res.json({ bannedTerms });
});

router.delete('/:id', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const id = req.params.id as string;

  const existing = await queryOne(
    `DELETE FROM banned_terms WHERE id = $1 AND organization_id = $2 RETURNING id, term`,
    [id, orgId]
  );

  if (!existing) {
    res.status(404).json({ error: 'Term not found' });
    return;
  }

  await logAudit(orgId, req.user!.userId, 'delete_banned_term', 'banned_term', id, {
    term: existing.term
  });

  res.json({ message: 'Banned term deleted successfully' });
});

export default router;
