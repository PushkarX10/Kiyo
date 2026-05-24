import { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "./ui/pagination";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Plus, QrCode, Eye, Pencil, FileText, Search, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

type Status = "Pending" | "Testing" | "Passed" | "Failed";

interface Batch {
  id: string;
  batchCode: string;
  productName: string;
  manufacturer: string;
  supplier: string;
  mfgDate: string;
  expiryDate: string;
  status: Status;
  createdBy: string;
  createdAt: string;
  quantity: string;
}

interface HistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  timestamp: string;
  notes: string;
}

const statusStyles: Record<Status, string> = {
  Pending: "bg-[#e2e2e2] text-[#1c0f13] dark:bg-[#2a1d20] dark:text-[#bbbac6] border-transparent",
  Testing: "bg-[#b7cece]/50 text-[#1c0f13] dark:bg-[#b7cece]/15 dark:text-[#b7cece] border-transparent",
  Passed: "bg-[#b7cece] text-[#1c0f13] dark:bg-[#b7cece]/15 dark:text-[#b7cece] border-transparent",
  Failed: "bg-[#a04249]/15 text-[#a04249] dark:bg-[#a04249]/25 dark:text-[#c46e75] border-transparent",
};

export function BatchesScreen() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>("all");
  const [supplier, setSupplier] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Add batch dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({
    productName: "", manufacturer: "", supplier: "", mfgDate: "", expiryDate: "", quantity: "",
  });

  // Detail dialog
  const [detailBatch, setDetailBatch] = useState<Batch | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      const params: Record<string, string> = {
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      };
      if (status !== "all") params.status = status;
      if (supplier !== "all") params.supplier = supplier;
      if (q) params.q = q;
      const data = await api.getBatches(params);
      setBatches(data.data);
      setTotal(data.total);
    } catch {
      // Server may not be running — use empty state
    }
  }, [status, supplier, q, page]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const suppliers = [...new Set(batches.map((b) => b.manufacturer))];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleAddBatch = async () => {
    if (!newBatch.productName || !newBatch.manufacturer || !newBatch.mfgDate || !newBatch.expiryDate) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const batch = await api.createBatch(newBatch);
      toast.success(`Batch ${batch.batchCode} created`, { description: batch.productName });
      setAddOpen(false);
      setNewBatch({ productName: "", manufacturer: "", supplier: "", mfgDate: "", expiryDate: "", quantity: "" });
      fetchBatches();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch");
    }
  };

  const openDetail = async (batch: Batch) => {
    setDetailBatch(batch);
    setDetailOpen(true);
    try {
      const data = await api.getBatch(batch.id);
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  };

  const transitionStatus = async (batchId: string, newStatus: string) => {
    try {
      await api.updateBatchStatus(batchId, newStatus, `Status → ${newStatus}`);
      toast.success(`Batch updated to ${newStatus}`);
      fetchBatches();
      if (detailBatch?.id === batchId) {
        const data = await api.getBatch(batchId);
        setDetailBatch(data);
        setHistory(data.history || []);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1>Batch Directory</h1>
          <p className="text-muted-foreground mt-1">
            Track, audit, and certify every production batch end-to-end.
          </p>
        </div>

        {/* Add New Batch Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" /> Add New Batch</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Register New Batch</DialogTitle>
              <DialogDescription>Create a new batch entry. A unique Batch ID and QR code will be auto-generated.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Product Name *</Label>
                <Input placeholder="e.g. Paracetamol 500mg" value={newBatch.productName} onChange={(e) => setNewBatch({ ...newBatch, productName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Manufacturer *</Label>
                <Input placeholder="e.g. Cipla Ltd." value={newBatch.manufacturer} onChange={(e) => setNewBatch({ ...newBatch, manufacturer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input placeholder="e.g. Hubei Granules" value={newBatch.supplier} onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mfg. Date *</Label>
                <Input type="date" value={newBatch.mfgDate} onChange={(e) => setNewBatch({ ...newBatch, mfgDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input type="date" value={newBatch.expiryDate} onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Quantity</Label>
                <Input placeholder="e.g. 120,000 tablets" value={newBatch.quantity} onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddBatch}>Create Batch</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search batch or product…" className="pl-9" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Testing">Testing</SelectItem>
              <SelectItem value="Passed">Passed</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={supplier} onValueChange={(v) => { setSupplier(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Supplier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All suppliers</SelectItem>
              {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select defaultValue="30">
            <SelectTrigger><SelectValue placeholder="Date range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Batch Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <QrCode className="size-4 text-muted-foreground" />
                    <span className="font-mono">{r.batchCode}</span>
                  </div>
                </TableCell>
                <TableCell>{r.productName}</TableCell>
                <TableCell className="text-muted-foreground">{r.manufacturer}</TableCell>
                <TableCell className="text-muted-foreground">{r.mfgDate}</TableCell>
                <TableCell>
                  <Badge className={statusStyles[r.status as Status]}>{r.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" aria-label="View" onClick={() => openDetail(r)}><Eye className="size-4" /></Button>
                    {r.status === "Pending" && (
                      <Button variant="ghost" size="icon" aria-label="Start Testing" onClick={() => transitionStatus(r.id, "Testing")}>
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" aria-label="Generate CoA"><FileText className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No batches match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-muted-foreground text-sm">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <Pagination className="m-0 mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(Math.max(1, page - 1)); }} />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(Math.min(totalPages, page + 1)); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      {/* Batch Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5" /> Batch {detailBatch?.batchCode}
            </DialogTitle>
            <DialogDescription>{detailBatch?.productName} · {detailBatch?.manufacturer}</DialogDescription>
          </DialogHeader>

          {detailBatch && (
            <div className="space-y-5">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusStyles[detailBatch.status as Status]}>{detailBatch.status}</Badge></div>
                <div><span className="text-muted-foreground">Quantity:</span> {detailBatch.quantity || "—"}</div>
                <div><span className="text-muted-foreground">Mfg Date:</span> {detailBatch.mfgDate}</div>
                <div><span className="text-muted-foreground">Expiry:</span> {detailBatch.expiryDate}</div>
                <div><span className="text-muted-foreground">Supplier:</span> {detailBatch.supplier || "—"}</div>
                <div><span className="text-muted-foreground">Created by:</span> {detailBatch.createdBy}</div>
              </div>

              {/* QR Code Simulation */}
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="size-20 rounded-md bg-[#1c0f13] dark:bg-white grid place-items-center">
                  <QrCode className="size-12 text-white dark:text-[#1c0f13]" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Scan QR Code</div>
                  <div className="text-muted-foreground">Contains batch ID, product, and status for instant field verification.</div>
                  <code className="text-xs mt-1 block text-muted-foreground">{detailBatch.batchCode}</code>
                </div>
              </div>

              <Separator />

              {/* Status Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Transition:</span>
                {detailBatch.status === "Pending" && (
                  <Button size="sm" onClick={() => transitionStatus(detailBatch.id, "Testing")}>
                    Start Testing <ArrowRight className="size-3 ml-1" />
                  </Button>
                )}
                {detailBatch.status === "Testing" && (
                  <>
                    <Button size="sm" className="bg-[#b7cece] text-[#1c0f13] hover:bg-[#a0bebe]" onClick={() => transitionStatus(detailBatch.id, "Passed")}>
                      Mark Passed
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => transitionStatus(detailBatch.id, "Failed")}>
                      Mark Failed
                    </Button>
                  </>
                )}
                {(detailBatch.status === "Passed" || detailBatch.status === "Failed") && (
                  <span className="text-xs text-muted-foreground">Final state — no further transitions</span>
                )}
              </div>

              <Separator />

              {/* History Timeline */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                  <Clock className="size-4" /> Audit Trail
                </h4>
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="flex gap-3 items-start">
                      <div className="mt-1.5 size-2 rounded-full bg-[#6e7e85] shrink-0" />
                      <div className="text-sm">
                        <div>
                          {h.fromStatus && <><Badge variant="outline" className="text-xs mr-1">{h.fromStatus}</Badge> → </>}
                          <Badge className={statusStyles[h.toStatus as Status] || ""}>{h.toStatus}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {h.changedBy} · {new Date(h.timestamp).toLocaleString()} {h.notes && `· ${h.notes}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-sm text-muted-foreground">No history available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
