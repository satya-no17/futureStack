import { Pool, PoolClient } from 'pg';
import pgvector from 'pgvector/pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inkloom';

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await pgvector.registerType(client);
    const sqlPath = fs.existsSync(path.join(__dirname, 'schema.sql'))
      ? path.join(__dirname, 'schema.sql')
      : path.join(__dirname, '../../src/db/schema.sql');
    const schemaSql = fs.readFileSync(sqlPath, 'utf-8');
    await client.query(schemaSql);
    console.log('[DB] Database schema and pgvector initialized successfully.');
  } finally {
    client.release();
  }
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    await pgvector.registerType(client);
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
