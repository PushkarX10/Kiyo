// ─── Testing Routes ───
import { Router } from "express";
import { testParameters, getTestsForBatch, submitTestResult, evaluateBatch } from "../data/test-parameters.js";

export const testingRouter = Router();

// GET /api/testing/parameters — List all test parameters
testingRouter.get("/parameters", (_req, res) => {
  res.json(testParameters);
});

// GET /api/testing/batch/:batchCode — Get test results for a batch
testingRouter.get("/batch/:batchCode", (req, res) => {
  const { round } = req.query;
  const results = getTestsForBatch(req.params.batchCode, round ? Number(round) : undefined);
  res.json({ batchCode: req.params.batchCode, results });
});

// POST /api/testing/submit — Submit a test result
testingRouter.post("/submit", (req, res) => {
  const { batchCode, parameterId, value, round } = req.body;
  if (!batchCode || !parameterId || value === undefined) {
    return res.status(400).json({ error: "batchCode, parameterId, and value are required" });
  }
  const result = submitTestResult({
    batchCode,
    parameterId,
    value,
    round: round || 1,
    testedBy: req.user.name,
  });
  if (!result) return res.status(400).json({ error: "Invalid parameter ID" });
  res.status(201).json(result);
});

// POST /api/testing/bulk-submit — Submit multiple test results at once
testingRouter.post("/bulk-submit", (req, res) => {
  const { batchCode, round, results: inputResults } = req.body;
  if (!batchCode || !Array.isArray(inputResults)) {
    return res.status(400).json({ error: "batchCode and results array are required" });
  }
  const submitted = [];
  for (const r of inputResults) {
    const result = submitTestResult({
      batchCode,
      parameterId: r.parameterId,
      value: r.value,
      round: round || 1,
      testedBy: req.user.name,
    });
    if (result) submitted.push(result);
  }
  res.status(201).json({ submitted: submitted.length, results: submitted });
});

// GET /api/testing/evaluate/:batchCode — Run pass/fail evaluation
testingRouter.get("/evaluate/:batchCode", (req, res) => {
  const { round } = req.query;
  const evaluation = evaluateBatch(req.params.batchCode, round ? Number(round) : 1);
  res.json(evaluation);
});

// POST /api/testing/visual-inspect — Mock AI visual inspection
testingRouter.post("/visual-inspect", (req, res) => {
  // Simulate AI visual defect detection
  const defects = [
    { type: "Surface Crack", confidence: 0.94, severity: "High", bbox: { x: 42, y: 38, w: 22, h: 22 } },
    { type: "Chipping", confidence: 0.78, severity: "Medium", bbox: { x: 65, y: 55, w: 12, h: 10 } },
    { type: "Discoloration", confidence: 0.62, severity: "Low", bbox: { x: 20, y: 70, w: 30, h: 15 } },
  ];
  // Randomly return 0-2 defects
  const count = Math.floor(Math.random() * 3);
  const found = defects.slice(0, count);
  res.json({
    model: "VisionPharma v2.4",
    analysisTime: `${(Math.random() * 2 + 0.5).toFixed(1)}s`,
    defectsFound: found.length,
    defects: found,
    verdict: found.some((d) => d.severity === "High") ? "REJECT" : found.length > 0 ? "REVIEW" : "PASS",
  });
});
