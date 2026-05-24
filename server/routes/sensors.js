// ─── Sensors Routes ───
import { Router } from "express";
import { getCurrentReadings, getSensorHistory, SENSORS } from "../services/sensor-simulator.js";

export const sensorsRouter = Router();

// GET /api/sensors/current — Latest readings for all sensors
sensorsRouter.get("/current", (_req, res) => {
  res.json(getCurrentReadings());
});

// GET /api/sensors/history — Historical data for a sensor
sensorsRouter.get("/history", (req, res) => {
  const { sensor, hours = 24 } = req.query;
  if (!sensor) {
    return res.status(400).json({ error: "sensor query parameter is required" });
  }
  const history = getSensorHistory(sensor, Number(hours));
  res.json({ sensorId: sensor, hours: Number(hours), dataPoints: history.length, data: history });
});

// GET /api/sensors/list — List all sensor configurations
sensorsRouter.get("/list", (_req, res) => {
  res.json(SENSORS.map((s) => ({ id: s.id, type: s.type, location: s.location, unit: s.unit, safe: s.safe, warn: s.warn })));
});
