"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeGuidelineChunks = storeGuidelineChunks;
exports.storeFactChunks = storeFactChunks;
const pg_1 = __importDefault(require("pgvector/pg"));
const db_1 = require("../../db");
const embed_1 = require("../../ai/embed");
/**
 * Embeds and stores guideline chunks into guideline_chunks table with organization isolation.
 */
async function storeGuidelineChunks(organizationId, guidelineId, chunks) {
    if (chunks.length === 0)
        return 0;
    const texts = chunks.map(c => c.content);
    const embeddings = await (0, embed_1.embed)(texts);
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingSql = pg_1.default.toSql(embeddings[i]);
        await (0, db_1.query)(`INSERT INTO guideline_chunks (organization_id, guideline_id, content, embedding, section_ref)
       VALUES ($1, $2, $3, $4, $5)`, [organizationId, guidelineId, chunk.content, embeddingSql, chunk.section_ref]);
    }
    return chunks.length;
}
/**
 * Embeds and stores fact chunks into fact_chunks table with organization isolation.
 */
async function storeFactChunks(organizationId, factDocumentId, chunks) {
    if (chunks.length === 0)
        return 0;
    const texts = chunks.map(c => c.content);
    const embeddings = await (0, embed_1.embed)(texts);
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingSql = pg_1.default.toSql(embeddings[i]);
        await (0, db_1.query)(`INSERT INTO fact_chunks (organization_id, fact_document_id, content, embedding, section_ref)
       VALUES ($1, $2, $3, $4, $5)`, [organizationId, factDocumentId, chunk.content, embeddingSql, chunk.section_ref]);
    }
    return chunks.length;
}
