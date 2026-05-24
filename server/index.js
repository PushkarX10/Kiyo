// ─── Kiyo Server — Main Entry Point ───
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import { authRouter } from "./routes/auth.js";
import { batchesRouter } from "./routes/batches.js";
import { testingRouter } from "./routes/testing.js";
import { sensorsRouter } from "./routes/sensors.js";
import { alertsRouter } from "./routes/alerts.js";
import { complianceRouter } from "./routes/compliance.js";
import { coaRouter } from "./routes/coa.js";
import { supplyRouter } from "./routes/supply.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authMiddleware } from "./middleware/auth.js";
import { auditLog } from "./middleware/audit.js";
import { startSensorSimulator } from "./services/sensor-simulator.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(auditLog);

// ─── Public routes ───
app.use("/api/auth", authRouter);

// ─── Protected routes ───
app.use("/api/batches", authMiddleware, batchesRouter);
app.use("/api/testing", authMiddleware, testingRouter);
app.use("/api/sensors", authMiddleware, sensorsRouter);
app.use("/api/alerts", authMiddleware, alertsRouter);
app.use("/api/compliance", authMiddleware, complianceRouter);
app.use("/api/coa", authMiddleware, coaRouter);
app.use("/api/supply", authMiddleware, supplyRouter);
app.use("/api/analytics", authMiddleware, analyticsRouter);

// ─── Health check ───
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "kiyo-api", timestamp: new Date().toISOString() });
});

// ─── HTTP + WebSocket Server ───
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/sensors" });

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");
  ws.on("close", () => console.log("[WS] Client disconnected"));
});

// ─── Start sensor simulator ───
startSensorSimulator(wss);

// ─── Start ───
server.listen(PORT, () => {
  console.log(`\n  🧪 Kiyo API running at http://localhost:${PORT}`);
  console.log(`  📡 WebSocket at ws://localhost:${PORT}/ws/sensors\n`);
});
