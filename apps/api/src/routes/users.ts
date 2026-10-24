import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logAudit } from '../services/audit';

const router = Router();

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'creator', 'reviewer']),
  password: z.string().min(6).optional().default('password123')
});

router.post('/invite', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const data = InviteSchema.parse(req.body);
  const orgId = req.user!.orgId;

  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
  if (existing) {
    res.status(400).json({ error: 'A user with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const newUser = await queryOne<{ id: string; name: string; email: string; role: string; created_at: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, created_at`,
    [orgId, data.name, data.email.toLowerCase(), passwordHash, data.role]
  );

  await logAudit(orgId, req.user!.userId, 'invite_user', 'user', newUser!.id, {
    invitedEmail: data.email,
    role: data.role
  });

  res.status(201).json({
    message: 'User invited successfully',
    user: newUser
  });
});

router.get('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const users = await query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            COUNT(c.id)::int as content_count
     FROM users u
     LEFT JOIN contents c ON c.created_by = u.id AND c.organization_id = u.organization_id
     WHERE u.organization_id = $1
     GROUP BY u.id, u.name, u.email, u.role, u.created_at
     ORDER BY u.created_at ASC`,
    [orgId]
  );

  res.json({ users });
});

export default router;
