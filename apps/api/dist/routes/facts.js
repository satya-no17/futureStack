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
const FactBodySchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    content: zod_1.z.string().optional(),
    effective_date: zod_1.z.string().optional(),
    file_url: zod_1.z.string().optional()
});
router.post('/', auth_1.authenticate, (0, requireRole_1.requireRole)('admin'), upload.single('file'), async (req, res) => {
    const orgId = req.user.orgId;
    let title = req.body.title;
    let text = req.body.content || '';
    let fileUrl = req.body.file_url || null;
    let effectiveDate = req.body.effective_date || new Date().toISOString().split('T')[0];
    if (req.file) {
        title = title || req.file.originalname.replace(/\.[^/.]+$/, '');
        text = await (0, extract_1.extractText)(req.file.buffer, req.file.originalname);
        fileUrl = req.file.originalname;
    }
    const validated = FactBodySchema.parse({
        title,
        content: text,
        effective_date: effectiveDate,
        file_url: fileUrl || undefined
    });
    // 1. Create fact document record
    const doc = await (0, db_1.queryOne)(`INSERT INTO fact_documents (organization_id, title, file_url, effective_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, file_url, effective_date, created_at`, [orgId, validated.title, fileUrl, effectiveDate]);
    if (!doc) {
        res.status(500).json({ error: 'Failed to create fact document' });
        return;
    }
    // 2. Chunk and store embeddings
    let chunksStored = 0;
    if (text && text.trim().length > 0) {
        const chunks = (0, chunk_1.chunkDocument)(text, validated.title);
        chunksStored = await (0, store_1.storeFactChunks)(orgId, doc.id, chunks);
    }
    await (0, audit_1.logAudit)(orgId, req.user.userId, 'upload_fact_document', 'fact_document', doc.id, {
        title: doc.title,
        chunksStored
    });
    res.status(201).json({
        message: 'Fact document uploaded and processed successfully',
        factDocument: doc,
        chunksStored
    });
});
router.get('/', auth_1.authenticate, async (req, res) => {
    const orgId = req.user.orgId;
    const facts = await (0, db_1.query)(`SELECT f.id, f.title, f.file_url, f.effective_date, f.created_at,
            COUNT(fc.id)::int as chunk_count
     FROM fact_documents f
     LEFT JOIN fact_chunks fc ON fc.fact_document_id = f.id AND fc.organization_id = f.organization_id
     WHERE f.organization_id = $1
     GROUP BY f.id, f.title, f.file_url, f.effective_date, f.created_at
     ORDER BY f.created_at DESC`, [orgId]);
    res.json({ facts });
});
exports.default = router;
