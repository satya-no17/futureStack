"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const extract_1 = require("../services/ingestion/extract");
const chunk_1 = require("../services/ingestion/chunk");
const store_1 = require("../services/ingestion/store");
const audit_1 = require("../services/audit");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const GuidelineBodySchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    kind: zod_1.z.enum(['voice', 'terminology', 'visual', 'legal', 'social']),
    content: zod_1.z.string().optional(),
    file_url: zod_1.z.string().optional()
});
router.post('/', auth_1.authenticate, (0, requireRole_1.requireRole)('admin'), upload.single('file'), async (req, res) => {
    const orgId = req.user.orgId;
    let title = req.body.title;
    let kind = req.body.kind;
    let text = req.body.content || '';
    let fileUrl = req.body.file_url || null;
    if (req.file) {
        title = title || req.file.originalname.replace(/\.[^/.]+$/, '');
        text = await (0, extract_1.extractText)(req.file.buffer, req.file.originalname);
        fileUrl = req.file.originalname;
    }
    const validated = GuidelineBodySchema.parse({
        title,
        kind,
        content: text,
        file_url: fileUrl || undefined
    });
    // 1. Create guideline record
    const guideline = await (0, db_1.queryOne)(`INSERT INTO guidelines (organization_id, title, kind, file_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, kind, file_url, created_at`, [orgId, validated.title, validated.kind, fileUrl]);
    if (!guideline) {
        res.status(500).json({ error: 'Failed to create guideline record' });
        return;
    }
    // 2. Chunk and store embeddings
    let chunksStored = 0;
    if (text && text.trim().length > 0) {
        const chunks = (0, chunk_1.chunkDocument)(text, validated.title);
        chunksStored = await (0, store_1.storeGuidelineChunks)(orgId, guideline.id, chunks);
    }
    await (0, audit_1.logAudit)(orgId, req.user.userId, 'upload_guideline', 'guideline', guideline.id, {
        title: guideline.title,
        kind: guideline.kind,
        chunksStored
    });
    res.status(201).json({
        message: 'Guideline uploaded and processed successfully',
        guideline,
        chunksStored
    });
});
router.get('/', auth_1.authenticate, async (req, res) => {
    const orgId = req.user.orgId;
    const guidelines = await (0, db_1.query)(`SELECT g.id, g.title, g.kind, g.file_url, g.created_at,
            COUNT(gc.id)::int as chunk_count
     FROM guidelines g
     LEFT JOIN guideline_chunks gc ON gc.guideline_id = g.id AND gc.organization_id = g.organization_id
     WHERE g.organization_id = $1
     GROUP BY g.id, g.title, g.kind, g.file_url, g.created_at
     ORDER BY g.created_at DESC`, [orgId]);
    res.json({ guidelines });
});
exports.default = router;
