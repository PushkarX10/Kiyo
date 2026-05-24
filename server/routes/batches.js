// ─── Batches Routes ───
import { Router } from "express";
import { batches, createBatch, updateBatchStatus, getBatchHistory, getBatchStats } from "../data/batches.js";

export const batchesRouter = Router();

// GET /api/batches — List with filters
batchesRouter.get("/", (req, res) => {
  const { status, supplier, q, limit = 20, offset = 0 } = req.query;
  let filtered = [...batches];

  if (status && status !== "all") filtered = filtered.filter((b) => b.status === status);
  if (supplier && supplier !== "all") filtered = filtered.filter((b) => b.manufacturer === supplier);
  if (q) {
    const search = q.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.productName.toLowerCase().includes(search) ||
        b.batchCode.toLowerCase().includes(search) ||
        b.manufacturer.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const data = filtered.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ total, data });
});

// GET /api/batches/stats — Summary statistics
batchesRouter.get("/stats", (_req, res) => {
  res.json(getBatchStats());
});

// GET /api/batches/:id — Batch detail
batchesRouter.get("/:id", (req, res) => {
  const batch = batches.find((b) => b.id === req.params.id || b.batchCode === req.params.id);
  if (!batch) return res.status(404).json({ error: "Batch not found" });
  const history = getBatchHistory(batch.id);
  res.json({ ...batch, history });
});

// POST /api/batches — Create new batch
batchesRouter.post("/", (req, res) => {
  const { productName, manufacturer, mfgDate, expiryDate, supplier, quantity } = req.body;
  if (!productName || !manufacturer || !mfgDate || !expiryDate) {
    return res.status(400).json({ error: "productName, manufacturer, mfgDate, and expiryDate are required" });
  }
  const batch = createBatch({ productName, manufacturer, mfgDate, expiryDate, supplier, quantity }, req.user.name);
  res.status(201).json(batch);
});

// PUT /api/batches/:id — Update batch metadata
batchesRouter.put("/:id", (req, res) => {
  const batch = batches.find((b) => b.id === req.params.id);
  if (!batch) return res.status(404).json({ error: "Batch not found" });

  const { productName, manufacturer, supplier, mfgDate, expiryDate, quantity } = req.body;
  if (productName) batch.productName = productName;
  if (manufacturer) batch.manufacturer = manufacturer;
  if (supplier) batch.supplier = supplier;
  if (mfgDate) batch.mfgDate = mfgDate;
  if (expiryDate) batch.expiryDate = expiryDate;
  if (quantity) batch.quantity = quantity;

  res.json(batch);
});

// PATCH /api/batches/:id/status — Transition batch status
batchesRouter.patch("/:id/status", (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ["Pending", "Testing", "Passed", "Failed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }
  const batch = updateBatchStatus(req.params.id, status, req.user.name, notes);
  if (!batch) return res.status(404).json({ error: "Batch not found" });
  res.json(batch);
});

// GET /api/batches/:id/history — Audit trail
batchesRouter.get("/:id/history", (req, res) => {
  const batch = batches.find((b) => b.id === req.params.id || b.batchCode === req.params.id);
  if (!batch) return res.status(404).json({ error: "Batch not found" });
  res.json(getBatchHistory(batch.id));
});
