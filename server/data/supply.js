// ─── Supply Chain Data Store ───
import { v4 as uuid } from "uuid";

export const shipments = [
  { id: uuid(), shipCode: "SHP-22041", product: "Paracetamol API", supplier: "Hubei Granules", origin: "Wuhan, CN", destination: "Mumbai DC", eta: "2026-05-25", status: "In transit", progress: 62, qty: "2,400 kg", coldChain: false, tempOk: true },
  { id: uuid(), shipCode: "SHP-22042", product: "Azithromycin API", supplier: "MSN Labs", origin: "Hyderabad, IN", destination: "Mumbai DC", eta: "2026-05-24", status: "At customs", progress: 81, qty: "800 kg", coldChain: false, tempOk: true },
  { id: uuid(), shipCode: "SHP-22043", product: "mRNA Vaccine vials", supplier: "BioCold GmbH", origin: "Mainz, DE", destination: "Cold Vault A", eta: "2026-05-26", status: "In transit", progress: 45, qty: "12,000 vials", coldChain: true, tempOk: false },
  { id: uuid(), shipCode: "SHP-22044", product: "HPMC Capsules", supplier: "Capsugel", origin: "Colmar, FR", destination: "Pune Plant", eta: "2026-05-23", status: "Delayed", progress: 30, qty: "5.4 M units", coldChain: false, tempOk: true },
  { id: uuid(), shipCode: "SHP-22045", product: "Foil laminate rolls", supplier: "Constantia Flex", origin: "Vienna, AT", destination: "Pune Plant", eta: "2026-05-22", status: "Delivered", progress: 100, qty: "120 rolls", coldChain: false, tempOk: true },
  { id: uuid(), shipCode: "SHP-22046", product: "Lactose Monohydrate", supplier: "DFE Pharma", origin: "Goch, DE", destination: "Mumbai DC", eta: "2026-05-28", status: "Scheduled", progress: 5, qty: "9,000 kg", coldChain: false, tempOk: true },
];

export const suppliers = [
  { id: "SUP-001", name: "Hubei Granules", country: "China", gmp: "Certified", rating: 4.6, onTime: 96, openOrders: 4 },
  { id: "SUP-002", name: "MSN Labs", country: "India", gmp: "Certified", rating: 4.8, onTime: 98, openOrders: 2 },
  { id: "SUP-003", name: "BioCold GmbH", country: "Germany", gmp: "Certified", rating: 4.4, onTime: 91, openOrders: 1 },
  { id: "SUP-004", name: "Capsugel", country: "France", gmp: "Audit due", rating: 4.2, onTime: 88, openOrders: 3 },
  { id: "SUP-005", name: "Constantia Flex", country: "Austria", gmp: "Certified", rating: 4.5, onTime: 94, openOrders: 1 },
  { id: "SUP-006", name: "DFE Pharma", country: "Germany", gmp: "Pending", rating: 4.0, onTime: 85, openOrders: 2 },
];

export const inventory = [
  { sku: "API-PCM-500", name: "Paracetamol API", category: "API", onHand: 1840, reorder: 1500, cap: 4000, unit: "kg", lot: "L-22018", expires: "2027-08-12" },
  { sku: "API-AMX-250", name: "Amoxicillin API", category: "API", onHand: 420, reorder: 600, cap: 2000, unit: "kg", lot: "L-22021", expires: "2027-02-04" },
  { sku: "EXC-LAC-001", name: "Lactose Monohydrate", category: "Excipient", onHand: 6200, reorder: 3000, cap: 10000, unit: "kg", lot: "L-22014", expires: "2028-01-30" },
  { sku: "EXC-MGS-002", name: "Magnesium Stearate", category: "Excipient", onHand: 95, reorder: 120, cap: 800, unit: "kg", lot: "L-22019", expires: "2027-11-09" },
  { sku: "PKG-CAP-HPMC", name: "HPMC Capsules", category: "Packaging", onHand: 3200000, reorder: 2000000, cap: 8000000, unit: "units", lot: "L-22022", expires: "2029-04-18" },
  { sku: "PKG-FOIL-12", name: "Foil laminate roll", category: "Packaging", onHand: 78, reorder: 60, cap: 200, unit: "rolls", lot: "L-22020", expires: "—" },
];

let shipCounter = 22047;

export function createShipment(data) {
  const ship = {
    id: uuid(),
    shipCode: `SHP-${shipCounter++}`,
    product: data.product,
    supplier: data.supplier,
    origin: data.origin || "—",
    destination: data.destination || "Mumbai DC",
    eta: data.eta || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: "Scheduled",
    progress: 0,
    qty: data.qty,
    coldChain: data.coldChain || false,
    tempOk: true,
  };
  shipments.unshift(ship);
  return ship;
}

export function getSupplyStats() {
  const inTransit = shipments.filter((s) => s.status === "In transit" || s.status === "At customs").length;
  const delayed = shipments.filter((s) => s.status === "Delayed").length;
  const lowStock = inventory.filter((i) => i.onHand < i.reorder).length;
  const coldBreach = shipments.filter((s) => s.coldChain && !s.tempOk).length;
  return { inTransit, delayed, lowStock, coldBreach };
}
