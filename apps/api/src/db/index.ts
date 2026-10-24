import { Pool } from 'pg';
import pgvector from 'pgvector/pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inkloom';

const isCloudDb =
  connectionString.includes('sslmode=require') ||
  connectionString.includes('neon.tech') ||
  connectionString.includes('supabase.co') ||
  connectionString.includes('render.com');

export const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    // 1. Create vector and uuid extensions FIRST before registering types
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    } catch (err: any) {
      console.warn('[DB] Warning creating vector extension (might already exist or managed):', err.message);
    }

    // 2. Read and execute database schema
    const sqlPath = fs.existsSync(path.join(__dirname, 'schema.sql'))
      ? path.join(__dirname, 'schema.sql')
      : path.join(__dirname, '../../src/db/schema.sql');
    const schemaSql = fs.readFileSync(sqlPath, 'utf-8');
    await client.query(schemaSql);

    // 3. Register vector type with client after extension is verified
    try {
      await pgvector.registerType(client);
    } catch (err: any) {
      console.warn('[DB] Notice on registerType:', err.message);
    }

    // 4. Ensure error_message column exists on reviews table
    try {
      await client.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS error_message TEXT;');
    } catch (err: any) {
      console.warn('[DB] Notice on ALTER TABLE reviews:', err.message);
    }

    console.log('[DB] Database schema and pgvector initialized successfully.');
  } finally {
    client.release();
  }
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    try {
      await pgvector.registerType(client);
    } catch {
      // Type already registered or will be sent as sql vector string
    }
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
