// ─── Audit Logger Middleware ───
import { addAuditEntry } from "../data/audit-log.js";

export function auditLog(req, res, next) {
  // Skip logging for GET requests and health checks to reduce noise
  if (req.method === "GET" || req.path === "/api/health") {
    return next();
  }

  // Capture the original json method to intercept response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Only log successful mutations
    if (res.statusCode < 400) {
      addAuditEntry({
        userId: req.user?.id,
        userName: req.user?.name,
        action: `${req.method} ${req.path}`,
        entity: req.path.split("/")[2] || "",
        entityId: req.params?.id || "",
        details: JSON.stringify(body).slice(0, 200),
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
    }
    return originalJson(body);
  };

  next();
}
