"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const audit_1 = require("../services/audit");
const router = (0, express_1.Router)();
const InviteSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['admin', 'creator', 'reviewer']),
    password: zod_1.z.string().min(6).optional().default('password123')
});
router.post('/invite', auth_1.authenticate, (0, requireRole_1.requireRole)('admin'), async (req, res) => {
    const data = InviteSchema.parse(req.body);
    const orgId = req.user.orgId;
    const existing = await (0, db_1.queryOne)('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
    if (existing) {
        res.status(400).json({ error: 'A user with this email already exists' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const newUser = await (0, db_1.queryOne)(`INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, created_at`, [orgId, data.name, data.email.toLowerCase(), passwordHash, data.role]);
    await (0, audit_1.logAudit)(orgId, req.user.userId, 'invite_user', 'user', newUser.id, {
        invitedEmail: data.email,
        role: data.role
    });
    res.status(201).json({
        message: 'User invited successfully',
        user: newUser
    });
});
router.get('/', auth_1.authenticate, (0, requireRole_1.requireRole)('admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const users = await (0, db_1.query)(`SELECT u.id, u.name, u.email, u.role, u.created_at,
            COUNT(c.id)::int as content_count
     FROM users u
     LEFT JOIN contents c ON c.created_by = u.id AND c.organization_id = u.organization_id
     WHERE u.organization_id = $1
     GROUP BY u.id, u.name, u.email, u.role, u.created_at
     ORDER BY u.created_at ASC`, [orgId]);
    res.json({ users });
});
exports.default = router;
