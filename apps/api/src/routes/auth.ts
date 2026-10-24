import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-inkloom-brand-governance-key-2026';

const RegisterSchema = z.object({
  orgName: z.string().min(2),
  orgType: z.enum(['enterprise', 'solo']).default('enterprise'),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/register', async (req: Request, res: Response) => {
  const data = RegisterSchema.parse(req.body);

  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
  if (existing) {
    res.status(400).json({ error: 'User with this email already exists' });
    return;
  }

  // 1. Create organization
  const org = await queryOne<{ id: string; name: string; type: string }>(
    `INSERT INTO organizations (name, type) VALUES ($1, $2) RETURNING id, name, type`,
    [data.orgName, data.orgType]
  );

  if (!org) {
    res.status(500).json({ error: 'Failed to create organization' });
    return;
  }

  // 2. Hash password & create user
  const passwordHash = await bcrypt.hash(data.password, 10);
  const role = data.orgType === 'solo' ? 'solo' : 'admin';

  const user = await queryOne<{ id: string; name: string; email: string; role: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role`,
    [org.id, data.name, data.email.toLowerCase(), passwordHash, role]
  );

  if (!user) {
    res.status(500).json({ error: 'Failed to create user' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, orgId: org.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  await logAudit(org.id, user.id, 'register', 'user', user.id, { email: user.email, orgName: org.name });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    organization: org
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const data = LoginSchema.parse(req.body);

  const user = await queryOne<{
    id: string;
    organization_id: string;
    name: string;
    email: string;
    password_hash: string;
    role: 'admin' | 'creator' | 'reviewer' | 'solo';
  }>('SELECT id, organization_id, name, email, password_hash, role FROM users WHERE email = $1', [data.email.toLowerCase()]);

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const isMatch = await bcrypt.compare(data.password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const org = await queryOne<{ id: string; name: string; type: string }>(
    'SELECT id, name, type FROM organizations WHERE id = $1',
    [user.organization_id]
  );

  const token = jwt.sign(
    { userId: user.id, orgId: user.organization_id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  await logAudit(user.organization_id, user.id, 'login', 'user', user.id, { email: user.email });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    organization: org
  });
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await queryOne<{ id: string; organization_id: string; name: string; email: string; role: string }>(
    'SELECT id, organization_id, name, email, role FROM users WHERE id = $1',
    [req.user!.userId]
  );

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const org = await queryOne<{ id: string; name: string; type: string }>(
    'SELECT id, name, type FROM organizations WHERE id = $1',
    [user.organization_id]
  );

  res.json({
    user,
    organization: org
  });
});

export default router;
