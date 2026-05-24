import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Activity, FileText, Download, CheckCircle2, XCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

interface CoAData {
  id: string;
  coaNumber: string;
  batchCode: string;
  productName: string;
  manufacturer: string;
  mfgDate: string;
  expiryDate: string;
  quantity: string;
  referenceStandard: string;
  issueDate: string;
  tests: Array<{ name: string; specification: string; result: string; conclusion: string }>;
  verdict: string;
  verdictText: string;
  signatures: { analyst: string; reviewer: string; authorizer: string };
  lab: { name: string; address: string; gmpCert: string };
}

interface BatchOption {
  batchCode: string;
  productName: string;
  status: string;
}

const defaultSections = [
  { id: "physical", label: "Physical tests", checked: true },
  { id: "chemical", label: "Chemical assays", checked: true },
  { id: "microbial", label: "Microbial limits", checked: true },
  { id: "stability", label: "Stability summary", checked: true },
];

export function CoAScreen() {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [round, setRound] = useState(1);
  const [analyst, setAnalyst] = useState("R. Mehta");
  const [reviewer, setReviewer] = useState("");
  const [authorizer, setAuthorizer] = useState("");
  const [sections, setSections] = useState(defaultSections);
  const [coa, setCoa] = useState<CoAData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [previousCoAs, setPreviousCoAs] = useState<Array<{ id: string; coaNumber: string; batchCode: string; productName: string; verdict: string; issueDate: string }>>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getBatches({ limit: "50" }).then((d) => {
      setBatches(d.data.map((b: { batchCode: string; productName: string; status: string }) => ({
        batchCode: b.batchCode,
        productName: b.productName,
        status: b.status,
      })));
    }).catch(() => {});

    api.listCoAs().then((d) => setPreviousCoAs(d.data || [])).catch(() => {});
  }, []);

  const generateCoA = async () => {
    if (!selectedBatch) {
      toast.error("Please select a batch");
      return;
    }
    setGenerating(true);
    try {
      const data = await api.generateCoA(selectedBatch, {
        round,
        analyst,
        reviewer,
        authorizer,
        sections: sections.filter((s) => s.checked).map((s) => s.label),
      });
      setCoa(data);
      toast.success(`CoA ${data.coaNumber} generated`, { description: data.productName });
      // Refresh list
      api.listCoAs().then((d) => setPreviousCoAs(d.data || [])).catch(() => {});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>CoA — ${coa?.coaNumber}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1c0f13; font-size: 13px; }
            h1 { font-size: 18px; margin-bottom: 4px; } h2 { font-size: 14px; margin: 20px 0 8px; color: #6e7e85; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e2e2e2; padding: 6px 10px; text-align: left; }
            th { background: #f8f8f8; font-weight: 600; }
            .pass { color: #1a7a1a; } .fail { color: #a04249; }
            .verdict { padding: 12px; border-radius: 8px; text-align: center; margin: 16px 0; font-weight: 600; font-size: 15px; }
            .verdict.pass { background: #e8f5e8; color: #1a7a1a; }
            .verdict.fail { background: #fde8e8; color: #a04249; }
            .sig-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 24px; }
            .sig { border-top: 1px solid #ccc; padding-top: 8px; }
            .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e2e2; display: flex; justify-content: space-between; color: #999; }
          </style></head><body>
          ${printRef.current.innerHTML}
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2"><FileText className="size-6 text-[#6e7e85]" /> Certificate of Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Generate, preview, and download compliance certificates for tested batches.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column — Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription>Select batch and configure the certificate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger><SelectValue placeholder="Select batch…" /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.batchCode} value={b.batchCode}>
                        {b.batchCode} — {b.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Test Round</Label>
                <Select value={String(round)} onValueChange={(v) => setRound(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Round 1 — Initial</SelectItem>
                    <SelectItem value="2">Round 2 — Retest</SelectItem>
                    <SelectItem value="3">Round 3 — Arbitration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Included Sections</Label>
                {sections.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`sec-${s.id}`}
                      checked={s.checked}
                      onCheckedChange={(checked) =>
                        setSections((prev) => prev.map((p) => p.id === s.id ? { ...p, checked: !!checked } : p))
                      }
                    />
                    <label htmlFor={`sec-${s.id}`} className="text-sm">{s.label}</label>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>E-Signatures</Label>
                <div className="space-y-2">
                  <Input placeholder="Analyst" value={analyst} onChange={(e) => setAnalyst(e.target.value)} />
                  <Input placeholder="Reviewer" value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
                  <Input placeholder="Authorizer" value={authorizer} onChange={(e) => setAuthorizer(e.target.value)} />
                </div>
              </div>

              <Button onClick={generateCoA} disabled={generating || !selectedBatch} className="w-full">
                {generating ? "Generating…" : "Generate Certificate"}
              </Button>
            </CardContent>
          </Card>

          {/* Previous CoAs */}
          {previousCoAs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Previous Certificates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {previousCoAs.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    onClick={async () => {
                      try {
                        const data = await api.getCoA(c.id);
                        setCoa(data);
                      } catch { /* ignore */ }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{c.coaNumber}</span>
                      <Badge
                        className={
                          c.verdict === "COMPLIES"
                            ? "bg-[#b7cece]/50 text-[#1c0f13] border-transparent text-xs"
                            : "bg-[#a04249]/15 text-[#a04249] border-transparent text-xs"
                        }
                      >
                        {c.verdict}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.batchCode} · {c.issueDate}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column — Certificate Preview */}
        <div className="xl:col-span-2">
          {coa ? (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{coa.coaNumber}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="size-4" /> Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Download className="size-4" /> Download PDF
                  </Button>
                </div>
              </div>
              <div ref={printRef} className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
                      <Activity className="size-5" />
                    </div>
                    <div>
                      <div className="text-slate-900 font-semibold">{coa.lab.name}</div>
                      <div className="text-xs text-slate-500">{coa.lab.address} · {coa.lab.gmpCert}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">CERTIFICATE OF ANALYSIS</div>
                    <div className="text-muted-foreground">{coa.coaNumber}</div>
                  </div>
                </div>

                <Separator />

                {/* Batch Information */}
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">Batch Information</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Product:</span> {coa.productName}</div>
                    <div><span className="text-muted-foreground">Batch No:</span> {coa.batchCode}</div>
                    <div><span className="text-muted-foreground">Manufacturer:</span> {coa.manufacturer}</div>
                    <div><span className="text-muted-foreground">Quantity:</span> {coa.quantity || "—"}</div>
                    <div><span className="text-muted-foreground">Mfg. Date:</span> {coa.mfgDate}</div>
                    <div><span className="text-muted-foreground">Exp. Date:</span> {coa.expiryDate}</div>
                    <div><span className="text-muted-foreground">Reference:</span> {coa.referenceStandard}</div>
                    <div><span className="text-muted-foreground">Issue Date:</span> {coa.issueDate}</div>
                  </div>
                </div>

                <Separator />

                {/* Test Results Table */}
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">Analytical Results</h2>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Test</th>
                        <th className="text-left py-2 pr-4">Specification</th>
                        <th className="text-left py-2 pr-4">Result</th>
                        <th className="text-left py-2">Conclusion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coa.tests.map((t, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{t.name}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{t.specification}</td>
                          <td className="py-2 pr-4 font-mono">{t.result}</td>
                          <td className="py-2">
                            {t.conclusion === "Complies" ? (
                              <span className="inline-flex items-center gap-1 text-[#1a7a1a]">
                                <CheckCircle2 className="size-3" /> Complies
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#a04249]">
                                <XCircle className="size-3" /> Fails
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {coa.tests.length === 0 && (
                        <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No test results available for this batch/round</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Verdict */}
                <div
                  className={`rounded-lg p-4 text-center font-semibold ${
                    coa.verdict === "COMPLIES"
                      ? "bg-[#b7cece]/30 text-[#1c0f13]"
                      : "bg-[#a04249]/10 text-[#a04249]"
                  }`}
                >
                  {coa.verdict}
                </div>
                <p className="text-sm text-muted-foreground text-center">{coa.verdictText}</p>

                <Separator />

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-4">
                  {[
                    { label: "Analyst", name: coa.signatures.analyst },
                    { label: "Reviewed by", name: coa.signatures.reviewer },
                    { label: "Authorized by", name: coa.signatures.authorizer },
                  ].map((sig) => (
                    <div key={sig.label}>
                      <div className="h-10 border-b border-dashed mb-1" />
                      <div className="text-xs text-muted-foreground">{sig.label}</div>
                      <div className="text-sm font-medium">{sig.name || "—"}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <footer className="mt-10 pt-4 border-t text-xs text-muted-foreground flex justify-between">
                  <span>{coa.lab.name} · Confidential</span>
                  <span>Page 1 of 1</span>
                </footer>
              </div>
            </Card>
          ) : (
            <Card className="p-16 text-center text-muted-foreground">
              <FileText className="size-12 mx-auto mb-4 opacity-30" />
              <p>Select a batch and generate a Certificate of Analysis to preview it here.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
