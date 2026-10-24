import pgvector from 'pgvector/pg';
import { query } from '../../db';
import { embed } from '../../ai/embed';
import { TextChunk } from './chunk';

/**
 * Embeds and stores guideline chunks into guideline_chunks table with organization isolation.
 */
export async function storeGuidelineChunks(
  organizationId: string,
  guidelineId: string,
  chunks: TextChunk[]
): Promise<number> {
  if (chunks.length === 0) return 0;

  const texts = chunks.map(c => c.content);
  const embeddings = await embed(texts);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embeddingSql = pgvector.toSql(embeddings[i]);

    await query(
      `INSERT INTO guideline_chunks (organization_id, guideline_id, content, embedding, section_ref)
       VALUES ($1, $2, $3, $4, $5)`,
      [organizationId, guidelineId, chunk.content, embeddingSql, chunk.section_ref]
    );
  }

  return chunks.length;
}

/**
 * Embeds and stores fact chunks into fact_chunks table with organization isolation.
 */
export async function storeFactChunks(
  organizationId: string,
  factDocumentId: string,
  chunks: TextChunk[]
): Promise<number> {
  if (chunks.length === 0) return 0;

  const texts = chunks.map(c => c.content);
  const embeddings = await embed(texts);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embeddingSql = pgvector.toSql(embeddings[i]);

    await query(
      `INSERT INTO fact_chunks (organization_id, fact_document_id, content, embedding, section_ref)
       VALUES ($1, $2, $3, $4, $5)`,
      [organizationId, factDocumentId, chunk.content, embeddingSql, chunk.section_ref]
    );
  }

  return chunks.length;
}
