// ─── Alerts Routes ───
import { Router } from "express";
import { v4 as uuid } from "uuid";

export const alertsRouter = Router();

// In-memory alerts store
const alerts = [
  { id: uuid(), sensorId: "temp-lab3", severity: "critical", message: "Lab-3 temp exceeded 23.5°C threshold", acknowledged: false, acknowledgedBy: null, timestamp: "2026-05-23T14:22:00Z" },
  { id: uuid(), sensorId: "hum-lab1", severity: "warning", message: "Humidity drift in Vault-A nearing 55%", acknowledged: false, acknowledgedBy: null, timestamp: "2026-05-23T13:58:00Z" },
  { id: uuid(), sensorId: null, severity: "warning", message: "Batch #88491 dissolution rate borderline", acknowledged: false, acknowledgedBy: null, timestamp: "2026-05-23T12:40:00Z" },
  { id: uuid(), sensorId: null, severity: "info", message: "CoA generated for Batch #88488", acknowledged: true, acknowledgedBy: "System", timestamp: "2026-05-23T11:05:00Z" },
  { id: uuid(), sensorId: "press-cr2", severity: "critical", message: "Pressure differential in cleanroom CR-2", acknowledged: false, acknowledgedBy: null, timestamp: "2026-05-23T09:30:00Z" },
  { id: uuid(), sensorId: null, severity: "info", message: "Calibration completed: HPLC unit 4", acknowledged: true, acknowledgedBy: "R. Mehta", timestamp: "2026-05-23T08:12:00Z" },
];

// GET /api/alerts — List alerts
alertsRouter.get("/", (req, res) => {
  const { severity, acknowledged, limit = 50 } = req.query;
  let filtered = [...alerts];
  if (severity) filtered = filtered.filter((a) => a.severity === severity);
  if (acknowledged !== undefined) filtered = filtered.filter((a) => a.acknowledged === (acknowledged === "true"));
  res.json({ total: filtered.length, data: filtered.slice(0, Number(limit)) });
});

// GET /api/alerts/count — Alert counts by severity
alertsRouter.get("/count", (_req, res) => {
  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  res.json({
    total: unacknowledged.length,
    critical: unacknowledged.filter((a) => a.severity === "critical").length,
    warning: unacknowledged.filter((a) => a.severity === "warning").length,
    info: unacknowledged.filter((a) => a.severity === "info").length,
  });
});

// POST /api/alerts/:id/acknowledge — Acknowledge alert
alertsRouter.post("/:id/acknowledge", (req, res) => {
  const alert = alerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.acknowledged = true;
  alert.acknowledgedBy = req.user.name;
  res.json(alert);
});

// POST /api/alerts — Create alert (used by sensor simulator)
alertsRouter.post("/", (req, res) => {
  const { sensorId, severity, message } = req.body;
  const alert = {
    id: uuid(),
    sensorId: sensorId || null,
    severity: severity || "warning",
    message,
    acknowledged: false,
    acknowledgedBy: null,
    timestamp: new Date().toISOString(),
  };
  alerts.unshift(alert);
  if (alerts.length > 200) alerts.pop();
  res.status(201).json(alert);
});
