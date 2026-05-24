// ─── Test Parameters & Results Data Store ───
import { v4 as uuid } from "uuid";

// Standard test parameters per product type
export const testParameters = [
  { id: "tp-ph", paramName: "pH", unit: "", specMin: 4.5, specMax: 6.5, method: "USP <791>" },
  { id: "tp-potency", paramName: "Potency", unit: "%", specMin: 95.0, specMax: 105.0, method: "USP <621> HPLC" },
  { id: "tp-purity", paramName: "Purity", unit: "%", specMin: 99.0, specMax: 100.0, method: "USP <621>" },
  { id: "tp-dissolution", paramName: "Dissolution Rate", unit: "%/30min", specMin: 80.0, specMax: 100.0, method: "USP <711>" },
  { id: "tp-moisture", paramName: "Moisture Content", unit: "%", specMin: 0, specMax: 2.0, method: "USP <921> Karl Fischer" },
  { id: "tp-related", paramName: "Related Substances", unit: "%", specMin: 0, specMax: 0.5, method: "USP <621> HPLC" },
  { id: "tp-microbial", paramName: "Microbial Limits", unit: "CFU/g", specMin: 0, specMax: 1000, method: "USP <61>" },
];

// Seeded test results for existing batches (keyed by batchCode)
export const testResults = [
  // B-88492 (Paracetamol 500mg — Testing)
  { id: uuid(), batchCode: "B-88492", parameterId: "tp-ph", round: 1, value: 5.8, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-20T10:30:00Z" },
  { id: uuid(), batchCode: "B-88492", parameterId: "tp-potency", round: 1, value: 99.2, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-20T10:35:00Z" },
  { id: uuid(), batchCode: "B-88492", parameterId: "tp-purity", round: 1, value: 99.7, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-20T10:40:00Z" },
  { id: uuid(), batchCode: "B-88492", parameterId: "tp-dissolution", round: 1, value: 86.4, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-20T10:45:00Z" },
  { id: uuid(), batchCode: "B-88492", parameterId: "tp-moisture", round: 1, value: 0.8, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-20T10:50:00Z" },
  { id: uuid(), batchCode: "B-88492", parameterId: "tp-related", round: 1, value: 0.18, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-20T10:55:00Z" },
  { id: uuid(), batchCode: "B-88492", parameterId: "tp-microbial", round: 1, value: 10, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-20T11:00:00Z" },

  // B-88491 (Amoxicillin — Passed)
  { id: uuid(), batchCode: "B-88491", parameterId: "tp-ph", round: 1, value: 5.2, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-19T11:00:00Z" },
  { id: uuid(), batchCode: "B-88491", parameterId: "tp-potency", round: 1, value: 101.3, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-19T11:05:00Z" },
  { id: uuid(), batchCode: "B-88491", parameterId: "tp-purity", round: 1, value: 99.5, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-19T11:10:00Z" },
  { id: uuid(), batchCode: "B-88491", parameterId: "tp-dissolution", round: 1, value: 92.1, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-19T11:15:00Z" },

  // B-88490 (Metformin — Failed: dissolution below spec)
  { id: uuid(), batchCode: "B-88490", parameterId: "tp-ph", round: 1, value: 6.1, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-19T09:00:00Z" },
  { id: uuid(), batchCode: "B-88490", parameterId: "tp-potency", round: 1, value: 97.8, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-19T09:05:00Z" },
  { id: uuid(), batchCode: "B-88490", parameterId: "tp-purity", round: 1, value: 99.1, pass: true, testedBy: "R. Mehta", timestamp: "2026-05-19T09:10:00Z" },
  { id: uuid(), batchCode: "B-88490", parameterId: "tp-dissolution", round: 1, value: 72.3, pass: false, testedBy: "R. Mehta", timestamp: "2026-05-19T09:15:00Z" },
];

export function getTestsForBatch(batchCode, round) {
  let results = testResults.filter((r) => r.batchCode === batchCode);
  if (round) results = results.filter((r) => r.round === round);
  return results.map((r) => {
    const param = testParameters.find((p) => p.id === r.parameterId);
    return { ...r, paramName: param?.paramName, unit: param?.unit, specMin: param?.specMin, specMax: param?.specMax, method: param?.method };
  });
}

export function submitTestResult(data) {
  const param = testParameters.find((p) => p.id === data.parameterId);
  if (!param) return null;
  const value = parseFloat(data.value);
  const pass = value >= param.specMin && value <= param.specMax;
  const result = {
    id: uuid(),
    batchCode: data.batchCode,
    parameterId: data.parameterId,
    round: data.round || 1,
    value,
    pass,
    testedBy: data.testedBy || "Lab Technician",
    timestamp: new Date().toISOString(),
  };
  testResults.push(result);
  return { ...result, paramName: param.paramName, unit: param.unit, specMin: param.specMin, specMax: param.specMax };
}

export function evaluateBatch(batchCode, round = 1) {
  const results = getTestsForBatch(batchCode, round);
  const allPass = results.length > 0 && results.every((r) => r.pass);
  const failedParams = results.filter((r) => !r.pass).map((r) => r.paramName);
  return {
    batchCode,
    round,
    totalTests: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    verdict: results.length === 0 ? "No tests" : allPass ? "PASS" : "FAIL",
    failedParameters: failedParams,
  };
}
