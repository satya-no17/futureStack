"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const db_1 = require("../db");
async function logAudit(organizationId, actorId, action, entityType, entityId, metadata = {}) {
    try {
        await (0, db_1.query)(`INSERT INTO audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`, [organizationId, actorId, action, entityType, entityId, JSON.stringify(metadata)]);
    }
    catch (err) {
        console.error('[AuditLog] Failed to record audit log:', err);
    }
}
