import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { calculateContrastRatio, a11yCheck } from '../services/review/a11yCheck';
import { authenticate } from '../middleware/auth';

const router = Router();

const ContrastSchema = z.object({
  foreground: z.string().regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  background: z.string().regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
});

const AuditTextSchema = z.object({
  text: z.string()
});

// POST /accessibility/contrast
router.post('/contrast', authenticate, (req: Request, res: Response) => {
  const data = ContrastSchema.parse(req.body);
  const ratio = calculateContrastRatio(data.foreground, data.background);

  const passesAAANormal = ratio >= 7.0;
  const passesAANormal = ratio >= 4.5;
  const passesAALarge = ratio >= 3.0;

  res.json({
    foreground: data.foreground,
    background: data.background,
    contrastRatio: ratio,
    wcag: {
      aaNormalText: passesAANormal,
      aaLargeText: passesAALarge,
      aaaNormalText: passesAAANormal
    }
  });
});

// POST /accessibility/audit-text
router.post('/audit-text', authenticate, (req: Request, res: Response) => {
  const data = AuditTextSchema.parse(req.body);
  const issues = a11yCheck(data.text);
  res.json({ issues });
});

export default router;
