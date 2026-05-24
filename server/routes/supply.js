// ─── Supply Chain Routes ───
import { Router } from "express";
import { shipments, suppliers, inventory, createShipment, getSupplyStats } from "../data/supply.js";

export const supplyRouter = Router();

// GET /api/supply/shipments — List shipments
supplyRouter.get("/shipments", (req, res) => {
  const { status, q } = req.query;
  let filtered = [...shipments];
  if (status && status !== "all") filtered = filtered.filter((s) => s.status === status);
  if (q) {
    const search = q.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.shipCode.toLowerCase().includes(search) ||
        s.product.toLowerCase().includes(search) ||
        s.supplier.toLowerCase().includes(search)
    );
  }
  res.json({ total: filtered.length, data: filtered });
});

// POST /api/supply/shipments — Create purchase order
supplyRouter.post("/shipments", (req, res) => {
  const ship = createShipment(req.body);
  res.status(201).json(ship);
});

// PATCH /api/supply/shipments/:id/deliver — Mark as delivered
supplyRouter.patch("/shipments/:id/deliver", (req, res) => {
  const ship = shipments.find((s) => s.id === req.params.id);
  if (!ship) return res.status(404).json({ error: "Shipment not found" });
  ship.status = "Delivered";
  ship.progress = 100;
  res.json(ship);
});

// PATCH /api/supply/shipments/:id/acknowledge-breach — Acknowledge temp excursion
supplyRouter.patch("/shipments/:id/acknowledge-breach", (req, res) => {
  const ship = shipments.find((s) => s.id === req.params.id);
  if (!ship) return res.status(404).json({ error: "Shipment not found" });
  ship.tempOk = true;
  res.json(ship);
});

// GET /api/supply/suppliers — List suppliers
supplyRouter.get("/suppliers", (_req, res) => {
  res.json(suppliers);
});

// GET /api/supply/inventory — Get inventory levels
supplyRouter.get("/inventory", (_req, res) => {
  res.json(inventory);
});

// GET /api/supply/stats — Supply chain statistics
supplyRouter.get("/stats", (_req, res) => {
  res.json(getSupplyStats());
});
