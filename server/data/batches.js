// ─── Batches Data Store ───
import { v4 as uuid } from "uuid";

let batchCounter = 88493;

export const batches = [
  { id: uuid(), batchCode: "B-88492", productName: "Paracetamol 500mg", manufacturer: "Cipla Ltd.", supplier: "Hubei Granules", mfgDate: "2026-04-12", expiryDate: "2029-04-11", status: "Testing", createdBy: "R. Mehta", createdAt: "2026-05-20T09:14:00Z", quantity: "120,000 tablets" },
  { id: uuid(), batchCode: "B-88491", productName: "Amoxicillin 250mg", manufacturer: "Sun Pharma", supplier: "MSN Labs", mfgDate: "2026-04-10", expiryDate: "2028-10-09", status: "Passed", createdBy: "R. Mehta", createdAt: "2026-05-19T10:00:00Z", quantity: "80,000 capsules" },
  { id: uuid(), batchCode: "B-88490", productName: "Metformin 850mg", manufacturer: "Dr. Reddy's", supplier: "DFE Pharma", mfgDate: "2026-04-08", expiryDate: "2029-01-07", status: "Failed", createdBy: "R. Mehta", createdAt: "2026-05-19T08:30:00Z", quantity: "200,000 tablets" },
  { id: uuid(), batchCode: "B-88489", productName: "Ibuprofen 400mg", manufacturer: "Lupin", supplier: "Hubei Granules", mfgDate: "2026-04-05", expiryDate: "2029-04-04", status: "Passed", createdBy: "R. Mehta", createdAt: "2026-05-18T11:20:00Z", quantity: "150,000 tablets" },
  { id: uuid(), batchCode: "B-88488", productName: "Azithromycin 500mg", manufacturer: "Zydus", supplier: "MSN Labs", mfgDate: "2026-04-03", expiryDate: "2028-04-02", status: "Pending", createdBy: "R. Mehta", createdAt: "2026-05-18T14:00:00Z", quantity: "60,000 tablets" },
  { id: uuid(), batchCode: "B-88487", productName: "Atorvastatin 20mg", manufacturer: "Cipla Ltd.", supplier: "Capsugel", mfgDate: "2026-04-01", expiryDate: "2028-12-31", status: "Passed", createdBy: "R. Mehta", createdAt: "2026-05-17T09:15:00Z", quantity: "90,000 tablets" },
  { id: uuid(), batchCode: "B-88486", productName: "Losartan 50mg", manufacturer: "Glenmark", supplier: "DFE Pharma", mfgDate: "2026-03-28", expiryDate: "2028-09-27", status: "Testing", createdBy: "R. Mehta", createdAt: "2026-05-16T10:00:00Z", quantity: "100,000 tablets" },
  { id: uuid(), batchCode: "B-88485", productName: "Omeprazole 20mg", manufacturer: "Sun Pharma", supplier: "Capsugel", mfgDate: "2026-03-25", expiryDate: "2028-09-24", status: "Passed", createdBy: "R. Mehta", createdAt: "2026-05-15T08:45:00Z", quantity: "70,000 capsules" },
  { id: uuid(), batchCode: "B-88484", productName: "Ciprofloxacin 500mg", manufacturer: "Cipla Ltd.", supplier: "MSN Labs", mfgDate: "2026-03-20", expiryDate: "2029-03-19", status: "Passed", createdBy: "R. Mehta", createdAt: "2026-05-14T09:00:00Z", quantity: "85,000 tablets" },
  { id: uuid(), batchCode: "B-88483", productName: "Doxycycline 100mg", manufacturer: "Dr. Reddy's", supplier: "Hubei Granules", mfgDate: "2026-03-18", expiryDate: "2028-09-17", status: "Passed", createdBy: "R. Mehta", createdAt: "2026-05-13T10:30:00Z", quantity: "50,000 capsules" },
  { id: uuid(), batchCode: "B-88482", productName: "Cetirizine 10mg", manufacturer: "Lupin", supplier: "DFE Pharma", mfgDate: "2026-03-15", expiryDate: "2029-03-14", status: "Pending", createdBy: "R. Mehta", createdAt: "2026-05-12T08:00:00Z", quantity: "200,000 tablets" },
  { id: uuid(), batchCode: "B-88481", productName: "Amlodipine 5mg", manufacturer: "Zydus", supplier: "Capsugel", mfgDate: "2026-03-12", expiryDate: "2029-03-11", status: "Passed", createdBy: "R. Mehta", createdAt: "2026-05-11T09:00:00Z", quantity: "110,000 tablets" },
];

export const batchHistory = [];

// Seed some history for existing batches
batches.forEach((b) => {
  batchHistory.push({
    id: uuid(),
    batchId: b.id,
    fromStatus: null,
    toStatus: "Pending",
    changedBy: b.createdBy,
    timestamp: b.createdAt,
    notes: "Batch registered",
  });
  if (b.status !== "Pending") {
    batchHistory.push({
      id: uuid(),
      batchId: b.id,
      fromStatus: "Pending",
      toStatus: "Testing",
      changedBy: b.createdBy,
      timestamp: new Date(new Date(b.createdAt).getTime() + 3600000).toISOString(),
      notes: "Testing initiated",
    });
  }
  if (b.status === "Passed" || b.status === "Failed") {
    batchHistory.push({
      id: uuid(),
      batchId: b.id,
      fromStatus: "Testing",
      toStatus: b.status,
      changedBy: "Dr. Anika Rao",
      timestamp: new Date(new Date(b.createdAt).getTime() + 86400000).toISOString(),
      notes: b.status === "Passed" ? "All parameters within specification" : "Dissolution rate below threshold",
    });
  }
});

export function createBatch(data, createdBy) {
  const batchCode = `B-${batchCounter++}`;
  const batch = {
    id: uuid(),
    batchCode,
    productName: data.productName,
    manufacturer: data.manufacturer,
    supplier: data.supplier || "",
    mfgDate: data.mfgDate,
    expiryDate: data.expiryDate,
    status: "Pending",
    createdBy,
    createdAt: new Date().toISOString(),
    quantity: data.quantity || "",
  };
  batches.unshift(batch);
  batchHistory.push({
    id: uuid(),
    batchId: batch.id,
    fromStatus: null,
    toStatus: "Pending",
    changedBy: createdBy,
    timestamp: batch.createdAt,
    notes: "Batch registered",
  });
  return batch;
}

export function updateBatchStatus(batchId, newStatus, changedBy, notes = "") {
  const batch = batches.find((b) => b.id === batchId);
  if (!batch) return null;
  const fromStatus = batch.status;
  batch.status = newStatus;
  batchHistory.push({
    id: uuid(),
    batchId,
    fromStatus,
    toStatus: newStatus,
    changedBy,
    timestamp: new Date().toISOString(),
    notes,
  });
  return batch;
}

export function getBatchHistory(batchId) {
  return batchHistory
    .filter((h) => h.batchId === batchId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function getBatchStats() {
  const total = batches.length;
  const passed = batches.filter((b) => b.status === "Passed").length;
  const failed = batches.filter((b) => b.status === "Failed").length;
  const testing = batches.filter((b) => b.status === "Testing").length;
  const pending = batches.filter((b) => b.status === "Pending").length;
  const passRate = total > 0 ? ((passed / (passed + failed || 1)) * 100).toFixed(1) : "0.0";
  return { total, passed, failed, testing, pending, passRate };
}
