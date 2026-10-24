import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { extractText } from '../services/ingestion/extract';
import { chunkDocument } from '../services/ingestion/chunk';
import { storeGuidelineChunks } from '../services/ingestion/store';
import { logAudit } from '../services/audit';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const GuidelineBodySchema = z.object({
  title: z.string().min(2),
  kind: z.enum(['voice', 'terminology', 'visual', 'legal', 'social']),
  content: z.string().optional(),
  file_url: z.string().optional()
});

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    const orgId = req.user!.orgId;
    let title = req.body.title;
    let kind = req.body.kind;
    let text = req.body.content || '';
    let fileUrl = req.body.file_url || null;

    if (req.file) {
      title = title || req.file.originalname.replace(/\.[^/.]+$/, '');
      text = await extractText(req.file.buffer, req.file.originalname);
      fileUrl = req.file.originalname;
    }

    const validated = GuidelineBodySchema.parse({
      title,
      kind,
      content: text,
      file_url: fileUrl || undefined
    });

    // 1. Create guideline record
    const guideline = await queryOne<{ id: string; title: string; kind: string; file_url: string; created_at: string }>(
      `INSERT INTO guidelines (organization_id, title, kind, file_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, kind, file_url, created_at`,
      [orgId, validated.title, validated.kind, fileUrl]
    );

    if (!guideline) {
      res.status(500).json({ error: 'Failed to create guideline record' });
      return;
    }

    // 2. Chunk and store embeddings
    let chunksStored = 0;
    if (text && text.trim().length > 0) {
      const chunks = chunkDocument(text, validated.title);
      chunksStored = await storeGuidelineChunks(orgId, guideline.id, chunks);
    }

    await logAudit(orgId, req.user!.userId, 'upload_guideline', 'guideline', guideline.id, {
      title: guideline.title,
      kind: guideline.kind,
      chunksStored
    });

    res.status(201).json({
      message: 'Guideline uploaded and processed successfully',
      guideline,
      chunksStored
    });
  }
);

router.get('/', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const guidelines = await query(
    `SELECT g.id, g.title, g.kind, g.file_url, g.created_at,
            COUNT(gc.id)::int as chunk_count
     FROM guidelines g
     LEFT JOIN guideline_chunks gc ON gc.guideline_id = g.id AND gc.organization_id = g.organization_id
     WHERE g.organization_id = $1
     GROUP BY g.id, g.title, g.kind, g.file_url, g.created_at
     ORDER BY g.created_at DESC`,
    [orgId]
  );

  res.json({ guidelines });
});

export default router;
