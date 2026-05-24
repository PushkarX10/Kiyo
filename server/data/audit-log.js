// ─── Audit Log Data Store ───
import { v4 as uuid } from "uuid";

export const auditLogs = [];

export function addAuditEntry(entry) {
  const log = {
    id: uuid(),
    userId: entry.userId || "system",
    userName: entry.userName || "System",
    action: entry.action,
    entity: entry.entity || "",
    entityId: entry.entityId || "",
    details: entry.details || "",
    timestamp: new Date().toISOString(),
    ipAddress: entry.ipAddress || "127.0.0.1",
  };
  auditLogs.unshift(log);
  // Keep last 1000 entries
  if (auditLogs.length > 1000) auditLogs.pop();
  return log;
}

export function getAuditLogs(filters = {}) {
  let logs = [...auditLogs];
  if (filters.entity) logs = logs.filter((l) => l.entity === filters.entity);
  if (filters.userId) logs = logs.filter((l) => l.userId === filters.userId);
  if (filters.action) logs = logs.filter((l) => l.action === filters.action);
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  return { total: logs.length, data: logs.slice(offset, offset + limit) };
}
