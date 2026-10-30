import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logAudit } from '../services/audit';

const router = Router();

const BannedTermSchema = z.object({
  term: z.string().trim().min(1).max(255),
  preferred_replacement: z.string().trim().max(255).default(''),
  reason: z.string().trim().max(2000).default(''),
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

router.post('/bulk', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const schema = z.object({ terms: z.array(BannedTermSchema).min(1).max(1000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide between 1 and 1,000 valid avoid-list entries.', details: parsed.error.flatten() });
    return;
  }
  const orgId = req.user!.orgId;
  const deduplicated = new Map<string, z.infer<typeof BannedTermSchema>>();
  for (const item of parsed.data.terms) {
    const term = item.term.trim();
    if (!term || term.length > 255) continue;
    const key = term.toLocaleLowerCase();
    if (!deduplicated.has(key)) deduplicated.set(key, { ...item, term });
  }
  const items = [...deduplicated.values()];
  const inserted = await query<{ id: string; term: string; preferred_replacement: string; reason: string; severity: string }>(
    `WITH incoming AS (
       SELECT * FROM jsonb_to_recordset($2::jsonb) AS x(term text, preferred_replacement text, reason text, severity text)
     ), fresh AS (
       SELECT DISTINCT ON (lower(trim(i.term))) trim(i.term) AS term,
         left(trim(coalesce(i.preferred_replacement, '')), 255) AS preferred_replacement,
         coalesce(i.reason, '') AS reason, i.severity
       FROM incoming i
       WHERE trim(i.term) <> '' AND length(trim(i.term)) <= 255
         AND NOT EXISTS (SELECT 1 FROM banned_terms b WHERE b.organization_id = $1 AND lower(b.term) = lower(trim(i.term)))
       ORDER BY lower(trim(i.term))
     )
     INSERT INTO banned_terms (organization_id, term, preferred_replacement, reason, severity)
     SELECT $1, term, preferred_replacement, reason, severity FROM fresh
     RETURNING id, term, preferred_replacement, reason, severity`,
    [orgId, JSON.stringify(items)]
  );
  const skippedCount = parsed.data.terms.length - inserted.length;
  await logAudit(orgId, req.user!.userId, 'bulk_create_banned_terms', 'banned_term', inserted[0]?.id || orgId, { importedCount: inserted.length, skippedCount });
  res.status(201).json({ bannedTerms: inserted, importedCount: inserted.length, skippedCount });
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
