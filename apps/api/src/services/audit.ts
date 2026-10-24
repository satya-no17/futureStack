import { query } from '../db';

export async function logAudit(
  organizationId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: any = {}
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [organizationId, actorId, action, entityType, entityId, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
  }
}
