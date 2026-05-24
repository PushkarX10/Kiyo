// ─── Compliance Routes ───
import { Router } from "express";
import { getAuditLogs } from "../data/audit-log.js";
import { getTestsForBatch, evaluateBatch } from "../data/test-parameters.js";

export const complianceRouter = Router();

// Compliance rules engine
const complianceRules = [
  { id: "WHO-TRS-1019", standard: "WHO", rule: "Dissolution test must meet ≥80% in 30 minutes", category: "Dissolution" },
  { id: "FDA-21CFR211", standard: "FDA", rule: "cGMP manufacturing requirements met", category: "Manufacturing" },
  { id: "USP-711", standard: "USP", rule: "Dissolution testing per USP <711> apparatus specifications", category: "Dissolution" },
  { id: "USP-621", standard: "USP", rule: "Chromatographic purity and potency assays", category: "Assay" },
  { id: "USP-791", standard: "USP", rule: "pH measurement within pharmacopeial range", category: "pH" },
  { id: "USP-61", standard: "USP", rule: "Microbial examination of non-sterile products", category: "Microbial" },
  { id: "USP-921", standard: "USP", rule: "Water determination (Karl Fischer)", category: "Moisture" },
  { id: "GMP-ISO-13485", standard: "GMP/ISO", rule: "Quality management system for medical devices", category: "QMS" },
  { id: "GMP-ANNEX-15", standard: "GMP", rule: "Qualification and validation protocols", category: "Validation" },
  { id: "CDSCO-RULE-96", standard: "CDSCO", rule: "Indian regulatory compliance for drug manufacturing", category: "Regulatory" },
];

// GET /api/compliance/rules — List all compliance rules
complianceRouter.get("/rules", (_req, res) => {
  res.json(complianceRules);
});

// POST /api/compliance/validate/:batchCode — Full compliance validation
complianceRouter.post("/validate/:batchCode", (req, res) => {
  const { batchCode } = req.params;
  const { round = 1 } = req.body;
  const tests = getTestsForBatch(batchCode, round);
  const evaluation = evaluateBatch(batchCode, round);

  const violations = [];
  tests.forEach((t) => {
    if (!t.pass) {
      const rule = complianceRules.find((r) => r.category.toLowerCase() === t.paramName?.toLowerCase());
      violations.push({
        parameter: t.paramName,
        value: t.value,
        specMin: t.specMin,
        specMax: t.specMax,
        rule: rule ? rule.id : "SPEC-DEVIATION",
        standard: rule ? rule.standard : "Internal",
        description: rule ? rule.rule : `${t.paramName} out of specification range`,
      });
    }
  });

  res.json({
    batchCode,
    round,
    compliant: violations.length === 0 && tests.length > 0,
    totalTests: tests.length,
    passed: evaluation.passed,
    failed: evaluation.failed,
    violations,
    standards: ["WHO TRS 1019", "FDA 21CFR211", "USP", "CDSCO"],
    validatedAt: new Date().toISOString(),
    validatedBy: req.user.name,
  });
});

// GET /api/compliance/audit-log — Tamper-proof audit trail
complianceRouter.get("/audit-log", (req, res) => {
  const { entity, userId, limit, offset } = req.query;
  const result = getAuditLogs({ entity, userId, limit: Number(limit) || 50, offset: Number(offset) || 0 });
  res.json(result);
});

// GET /api/compliance/checklist/:batchCode — GMP/ISO compliance checklist
complianceRouter.get("/checklist/:batchCode", (req, res) => {
  const checklist = [
    { item: "Raw material identity verified", status: "complete", evidence: "COA from supplier attached" },
    { item: "Manufacturing SOP followed", status: "complete", evidence: "SOP-MFG-042 Rev 3" },
    { item: "In-process controls within limits", status: "complete", evidence: "IPC log signed" },
    { item: "Finished product testing complete", status: "pending", evidence: "Awaiting dissolution results" },
    { item: "Stability data reviewed", status: "complete", evidence: "ICH Q1A conditions met" },
    { item: "Packaging integrity verified", status: "complete", evidence: "Visual inspection passed" },
    { item: "Environmental monitoring compliant", status: "complete", evidence: "All rooms within spec" },
    { item: "Documentation reviewed and signed", status: "pending", evidence: "Awaiting QA Manager signature" },
  ];
  res.json({ batchCode: req.params.batchCode, checklist });
});
