import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { extractText } from '../services/ingestion/extract';
import { chunkDocument } from '../services/ingestion/chunk';
import { storeFactChunks } from '../services/ingestion/store';
import { logAudit } from '../services/audit';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const FactBodySchema = z.object({
  title: z.string().min(2),
  content: z.string().optional(),
  effective_date: z.string().optional(),
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
    let text = req.body.content || '';
    let fileUrl = req.body.file_url || null;
    let effectiveDate = req.body.effective_date || new Date().toISOString().split('T')[0];

    if (req.file) {
      title = title || req.file.originalname.replace(/\.[^/.]+$/, '');
      text = await extractText(req.file.buffer, req.file.originalname);
      fileUrl = req.file.originalname;
    }

    const validated = FactBodySchema.parse({
      title,
      content: text,
      effective_date: effectiveDate,
      file_url: fileUrl || undefined
    });

    // 1. Create fact document record
    const doc = await queryOne<{ id: string; title: string; file_url: string; effective_date: string; created_at: string }>(
      `INSERT INTO fact_documents (organization_id, title, file_url, effective_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, file_url, effective_date, created_at`,
      [orgId, validated.title, fileUrl, effectiveDate]
    );

    if (!doc) {
      res.status(500).json({ error: 'Failed to create fact document' });
      return;
    }

    // 2. Chunk and store embeddings
    let chunksStored = 0;
    if (text && text.trim().length > 0) {
      const chunks = chunkDocument(text, validated.title);
      chunksStored = await storeFactChunks(orgId, doc.id, chunks);
    }

    await logAudit(orgId, req.user!.userId, 'upload_fact_document', 'fact_document', doc.id, {
      title: doc.title,
      chunksStored
    });

    res.status(201).json({
      message: 'Fact document uploaded and processed successfully',
      factDocument: doc,
      chunksStored
    });
  }
);

router.get('/', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const facts = await query(
    `SELECT f.id, f.title, f.file_url, f.effective_date, f.created_at,
            COUNT(fc.id)::int as chunk_count
     FROM fact_documents f
     LEFT JOIN fact_chunks fc ON fc.fact_document_id = f.id AND fc.organization_id = f.organization_id
     WHERE f.organization_id = $1
     GROUP BY f.id, f.title, f.file_url, f.effective_date, f.created_at
     ORDER BY f.created_at DESC`,
    [orgId]
  );

  res.json({ facts });
});

export default router;
