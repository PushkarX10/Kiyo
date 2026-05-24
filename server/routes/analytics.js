// ─── Analytics Routes (AI/ML Simulated) ───
import { Router } from "express";
import { batches } from "../data/batches.js";
import { testResults } from "../data/test-parameters.js";
import { suppliers } from "../data/supply.js";

export const analyticsRouter = Router();

// GET /api/analytics/anomalies — Flagged batches with deviation scores
analyticsRouter.get("/anomalies", (_req, res) => {
  const anomalies = batches
    .filter((b) => b.status === "Testing" || b.status === "Failed")
    .map((b) => {
      const results = testResults.filter((r) => r.batchCode === b.batchCode);
      const deviations = results.filter((r) => !r.pass);
      const score = deviations.length > 0 ? 0.4 + Math.random() * 0.5 : Math.random() * 0.3;
      return {
        batchCode: b.batchCode,
        productName: b.productName,
        manufacturer: b.manufacturer,
        status: b.status,
        deviationScore: Number(score.toFixed(2)),
        flags: deviations.map((d) => {
          const param = d.parameterId.replace("tp-", "");
          return `${param} out of spec (${d.value})`;
        }),
        recommendation: score > 0.7 ? "INVESTIGATE" : score > 0.4 ? "MONITOR" : "LOW RISK",
      };
    })
    .sort((a, b) => b.deviationScore - a.deviationScore);

  res.json({ total: anomalies.length, data: anomalies });
});

// GET /api/analytics/shelf-life/:batchCode — Predictive shelf-life
analyticsRouter.get("/shelf-life/:batchCode", (req, res) => {
  const batch = batches.find((b) => b.batchCode === req.params.batchCode);
  if (!batch) return res.status(404).json({ error: "Batch not found" });

  const mfgDate = new Date(batch.mfgDate);
  const expiryDate = new Date(batch.expiryDate);
  const totalDays = (expiryDate - mfgDate) / 86400000;
  const elapsed = (Date.now() - mfgDate) / 86400000;
  const remaining = totalDays - elapsed;

  // Simulated degradation model
  const degradationRate = 0.02 + Math.random() * 0.03; // % per month
  const predictedShelfLife = Math.max(0, totalDays * (1 - degradationRate * (elapsed / 30) * 0.01));
  const confidenceInterval = [predictedShelfLife * 0.85, predictedShelfLife * 1.05];

  res.json({
    batchCode: batch.batchCode,
    productName: batch.productName,
    mfgDate: batch.mfgDate,
    expiryDate: batch.expiryDate,
    totalDays: Math.round(totalDays),
    elapsedDays: Math.round(elapsed),
    remainingDays: Math.round(remaining),
    degradationRate: `${(degradationRate * 100).toFixed(2)}% per month`,
    predictedShelfLifeDays: Math.round(predictedShelfLife),
    confidenceInterval: confidenceInterval.map(Math.round),
    storageConditions: "25°C / 60% RH (ICH Zone II)",
    model: "Arrhenius-based accelerated stability v1.2",
  });
});

// GET /api/analytics/risk-score — Risk scores for all batches
analyticsRouter.get("/risk-scores", (_req, res) => {
  const scores = batches.map((b) => {
    const results = testResults.filter((r) => r.batchCode === b.batchCode);
    const failures = results.filter((r) => !r.pass).length;
    const total = results.length;
    const historyFactor = b.status === "Failed" ? 0.4 : b.status === "Testing" ? 0.2 : 0;
    const score = Math.min(1, (failures / Math.max(total, 1)) * 0.6 + historyFactor + Math.random() * 0.1);
    return {
      batchCode: b.batchCode,
      productName: b.productName,
      manufacturer: b.manufacturer,
      riskScore: Number(score.toFixed(2)),
      riskLevel: score > 0.7 ? "HIGH" : score > 0.3 ? "MEDIUM" : "LOW",
      factors: [
        total === 0 ? "No test data" : null,
        failures > 0 ? `${failures} test failure(s)` : null,
        b.status === "Failed" ? "Previous batch failure" : null,
      ].filter(Boolean),
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  res.json({ total: scores.length, data: scores });
});

// GET /api/analytics/supplier-risk — Supplier risk heatmap
analyticsRouter.get("/supplier-risk", (_req, res) => {
  const supplierRisk = suppliers.map((s) => ({
    name: s.name,
    country: s.country,
    gmpStatus: s.gmp,
    onTimeRate: s.onTime,
    rating: s.rating,
    riskScore: Number((1 - (s.onTime / 100) * 0.5 - (s.rating / 5) * 0.3 - (s.gmp === "Certified" ? 0.2 : s.gmp === "Pending" ? 0 : 0.1)).toFixed(2)),
    riskLevel: s.onTime < 90 ? "HIGH" : s.gmp !== "Certified" ? "MEDIUM" : "LOW",
  })).sort((a, b) => b.riskScore - a.riskScore);

  res.json(supplierRisk);
});
