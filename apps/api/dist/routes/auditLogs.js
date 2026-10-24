"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// GET /audit-logs
router.get('/', auth_1.authenticate, (0, requireRole_1.requireRole)('admin'), async (req, res) => {
    const orgId = req.user.orgId;
    const logs = await (0, db_1.query)(`SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
            u.name as actor_name, u.email as actor_email, u.role as actor_role
     FROM audit_logs a
     JOIN users u ON u.id = a.actor_id
     WHERE a.organization_id = $1
     ORDER BY a.created_at DESC
     LIMIT 100`, [orgId]);
    res.json({ logs });
});
exports.default = router;
