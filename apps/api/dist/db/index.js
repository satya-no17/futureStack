"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDb = initDb;
exports.query = query;
exports.queryOne = queryOne;
const pg_1 = require("pg");
const pg_2 = __importDefault(require("pgvector/pg"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inkloom';
exports.pool = new pg_1.Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
});
async function initDb() {
    const client = await exports.pool.connect();
    try {
        await pg_2.default.registerType(client);
        const sqlPath = fs_1.default.existsSync(path_1.default.join(__dirname, 'schema.sql'))
            ? path_1.default.join(__dirname, 'schema.sql')
            : path_1.default.join(__dirname, '../../src/db/schema.sql');
        const schemaSql = fs_1.default.readFileSync(sqlPath, 'utf-8');
        await client.query(schemaSql);
        console.log('[DB] Database schema and pgvector initialized successfully.');
    }
    finally {
        client.release();
    }
}
async function query(text, params = []) {
    const client = await exports.pool.connect();
    try {
        await pg_2.default.registerType(client);
        const res = await client.query(text, params);
        return res.rows;
    }
    finally {
        client.release();
    }
}
async function queryOne(text, params = []) {
    const rows = await query(text, params);
    return rows.length > 0 ? rows[0] : null;
}
