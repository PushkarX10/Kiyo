// ─── CoA (Certificate of Analysis) Routes ───
import { Router } from "express";
import { v4 as uuid } from "uuid";
import { batches } from "../data/batches.js";
import { getTestsForBatch } from "../data/test-parameters.js";

export const coaRouter = Router();

// In-memory CoA document store
const coaDocuments = [];

// POST /api/coa/generate/:batchCode — Generate CoA data
coaRouter.post("/generate/:batchCode", (req, res) => {
  const { batchCode } = req.params;
  const { round = 1, sections, analyst, reviewer, authorizer } = req.body;

  const batch = batches.find((b) => b.batchCode === batchCode);
  if (!batch) return res.status(404).json({ error: "Batch not found" });

  const tests = getTestsForBatch(batchCode, round);
  const allPass = tests.length > 0 && tests.every((t) => t.pass);

  const coa = {
    id: uuid(),
    coaNumber: `CoA-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${batchCode.replace("B-", "")}`,
    batchCode,
    round,
    productName: batch.productName,
    manufacturer: batch.manufacturer,
    mfgDate: batch.mfgDate,
    expiryDate: batch.expiryDate,
    quantity: batch.quantity,
    referenceStandard: "USP <711>, WHO TRS 1019",
    issueDate: new Date().toISOString().slice(0, 10),
    tests: tests.map((t) => ({
      name: t.paramName,
      specification: t.specMin !== undefined && t.specMax !== undefined
        ? t.specMin === 0 ? `≤ ${t.specMax}${t.unit ? " " + t.unit : ""}` : `${t.specMin} – ${t.specMax}${t.unit ? " " + t.unit : ""}`
        : "—",
      result: `${t.value}${t.unit ? " " + t.unit : ""}`,
      conclusion: t.pass ? "Complies" : "Fails",
    })),
    verdict: allPass ? "COMPLIES" : "DOES NOT COMPLY",
    verdictText: allPass
      ? "The above batch complies with the required quality specifications as per USP, WHO and CDSCO guidelines and is approved for release."
      : "The above batch does not meet one or more required quality specifications. The batch is held pending investigation.",
    signatures: {
      analyst: analyst || "R. Mehta",
      reviewer: reviewer || req.user.name,
      authorizer: authorizer || "—",
    },
    sections: sections || ["Physical tests", "Chemical assays", "Microbial limits", "Stability summary"],
    generatedBy: req.user.name,
    generatedAt: new Date().toISOString(),
    lab: {
      name: "Kiyo Laboratories",
      address: "221B Industrial Estate · Mumbai 400072",
      gmpCert: "GMP Cert. #IN-0421",
    },
  };

  coaDocuments.unshift(coa);
  res.status(201).json(coa);
});

// GET /api/coa/list — List all generated CoAs
coaRouter.get("/list", (_req, res) => {
  res.json({
    total: coaDocuments.length,
    data: coaDocuments.map((c) => ({
      id: c.id,
      coaNumber: c.coaNumber,
      batchCode: c.batchCode,
      productName: c.productName,
      verdict: c.verdict,
      issueDate: c.issueDate,
      generatedBy: c.generatedBy,
    })),
  });
});

// GET /api/coa/:id — Get full CoA document
coaRouter.get("/:id", (req, res) => {
  const coa = coaDocuments.find((c) => c.id === req.params.id);
  if (!coa) return res.status(404).json({ error: "CoA not found" });
  res.json(coa);
});
