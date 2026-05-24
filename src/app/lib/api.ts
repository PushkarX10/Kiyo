// ─── API Client ───
const API_BASE = "http://localhost:3001/api";

function getToken() {
  return localStorage.getItem("kiyo_token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem("kiyo_token");
    localStorage.removeItem("kiyo_user");
    window.location.reload();
    throw new Error("Authentication expired");
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; name: string; password: string; role: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  getDemoAccounts: () => request("/auth/users"),

  // Batches
  getBatches: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/batches${qs}`);
  },
  getBatchStats: () => request("/batches/stats"),
  getBatch: (id: string) => request(`/batches/${id}`),
  createBatch: (data: Record<string, string>) =>
    request("/batches", { method: "POST", body: JSON.stringify(data) }),
  updateBatch: (id: string, data: Record<string, string>) =>
    request(`/batches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateBatchStatus: (id: string, status: string, notes = "") =>
    request(`/batches/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, notes }) }),

  // Testing
  getTestParameters: () => request("/testing/parameters"),
  getTestResults: (batchCode: string, round?: number) => {
    const qs = round ? `?round=${round}` : "";
    return request(`/testing/batch/${batchCode}${qs}`);
  },
  submitTest: (data: { batchCode: string; parameterId: string; value: number; round?: number }) =>
    request("/testing/submit", { method: "POST", body: JSON.stringify(data) }),
  bulkSubmitTests: (data: { batchCode: string; round: number; results: Array<{ parameterId: string; value: number }> }) =>
    request("/testing/bulk-submit", { method: "POST", body: JSON.stringify(data) }),
  evaluateBatch: (batchCode: string, round = 1) =>
    request(`/testing/evaluate/${batchCode}?round=${round}`),
  visualInspect: (data?: Record<string, unknown>) =>
    request("/testing/visual-inspect", { method: "POST", body: JSON.stringify(data || {}) }),

  // Sensors
  getSensorCurrent: () => request("/sensors/current"),
  getSensorHistory: (sensor: string, hours = 24) =>
    request(`/sensors/history?sensor=${sensor}&hours=${hours}`),

  // Alerts
  getAlerts: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/alerts${qs}`);
  },
  getAlertCount: () => request("/alerts/count"),
  acknowledgeAlert: (id: string) =>
    request(`/alerts/${id}/acknowledge`, { method: "POST" }),

  // Compliance
  getComplianceRules: () => request("/compliance/rules"),
  validateBatch: (batchCode: string, round = 1) =>
    request(`/compliance/validate/${batchCode}`, { method: "POST", body: JSON.stringify({ round }) }),
  getAuditLog: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/compliance/audit-log${qs}`);
  },
  getChecklist: (batchCode: string) => request(`/compliance/checklist/${batchCode}`),

  // CoA
  generateCoA: (batchCode: string, data: Record<string, unknown>) =>
    request(`/coa/generate/${batchCode}`, { method: "POST", body: JSON.stringify(data) }),
  listCoAs: () => request("/coa/list"),
  getCoA: (id: string) => request(`/coa/${id}`),

  // Supply Chain
  getShipments: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/supply/shipments${qs}`);
  },
  createShipment: (data: Record<string, unknown>) =>
    request("/supply/shipments", { method: "POST", body: JSON.stringify(data) }),
  markDelivered: (id: string) =>
    request(`/supply/shipments/${id}/deliver`, { method: "PATCH" }),
  acknowledgeBreach: (id: string) =>
    request(`/supply/shipments/${id}/acknowledge-breach`, { method: "PATCH" }),
  getSuppliers: () => request("/supply/suppliers"),
  getInventory: () => request("/supply/inventory"),
  getSupplyStats: () => request("/supply/stats"),

  // Analytics
  getAnomalies: () => request("/analytics/anomalies"),
  getShelfLife: (batchCode: string) => request(`/analytics/shelf-life/${batchCode}`),
  getRiskScores: () => request("/analytics/risk-scores"),
  getSupplierRisk: () => request("/analytics/supplier-risk"),
};
