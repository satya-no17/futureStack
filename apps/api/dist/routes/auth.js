"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../services/audit");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-inkloom-brand-governance-key-2026';
const RegisterSchema = zod_1.z.object({
    orgName: zod_1.z.string().min(2),
    orgType: zod_1.z.enum(['enterprise', 'solo']).default('enterprise'),
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
router.post('/register', async (req, res) => {
    const data = RegisterSchema.parse(req.body);
    const existing = await (0, db_1.queryOne)('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
    if (existing) {
        res.status(400).json({ error: 'User with this email already exists' });
        return;
    }
    // 1. Create organization
    const org = await (0, db_1.queryOne)(`INSERT INTO organizations (name, type) VALUES ($1, $2) RETURNING id, name, type`, [data.orgName, data.orgType]);
    if (!org) {
        res.status(500).json({ error: 'Failed to create organization' });
        return;
    }
    // 2. Hash password & create user
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const role = data.orgType === 'solo' ? 'solo' : 'admin';
    const user = await (0, db_1.queryOne)(`INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role`, [org.id, data.name, data.email.toLowerCase(), passwordHash, role]);
    if (!user) {
        res.status(500).json({ error: 'Failed to create user' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, orgId: org.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    await (0, audit_1.logAudit)(org.id, user.id, 'register', 'user', user.id, { email: user.email, orgName: org.name });
    res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        organization: org
    });
});
router.post('/login', async (req, res) => {
    const data = LoginSchema.parse(req.body);
    const user = await (0, db_1.queryOne)('SELECT id, organization_id, name, email, password_hash, role FROM users WHERE email = $1', [data.email.toLowerCase()]);
    if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }
    const isMatch = await bcryptjs_1.default.compare(data.password, user.password_hash);
    if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }
    const org = await (0, db_1.queryOne)('SELECT id, name, type FROM organizations WHERE id = $1', [user.organization_id]);
    const token = jsonwebtoken_1.default.sign({ userId: user.id, orgId: user.organization_id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    await (0, audit_1.logAudit)(user.organization_id, user.id, 'login', 'user', user.id, { email: user.email });
    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        organization: org
    });
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    const user = await (0, db_1.queryOne)('SELECT id, organization_id, name, email, role FROM users WHERE id = $1', [req.user.userId]);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const org = await (0, db_1.queryOne)('SELECT id, name, type FROM organizations WHERE id = $1', [user.organization_id]);
    res.json({
        user,
        organization: org
    });
});
exports.default = router;
