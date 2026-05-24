import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FlaskConical, CheckCircle2, XCircle, Send, Upload, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

interface TestParameter {
  id: string;
  paramName: string;
  unit: string;
  specMin: number;
  specMax: number;
  method: string;
}

interface TestResult {
  id: string;
  batchCode: string;
  parameterId: string;
  paramName: string;
  unit: string;
  round: number;
  value: number;
  pass: boolean;
  testedBy: string;
  timestamp: string;
  specMin: number;
  specMax: number;
  method: string;
}

interface Evaluation {
  batchCode: string;
  round: number;
  totalTests: number;
  passed: number;
  failed: number;
  verdict: string;
  failedParameters: string[];
}

interface VisualResult {
  model: string;
  analysisTime: string;
  defectsFound: number;
  defects: Array<{ type: string; confidence: number; severity: string }>;
  verdict: string;
}

interface BatchOption {
  batchCode: string;
  productName: string;
  status: string;
}

export function TestingScreen() {
  const [parameters, setParameters] = useState<TestParameter[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<TestResult[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [visualResult, setVisualResult] = useState<VisualResult | null>(null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Load parameters and batch options
  useEffect(() => {
    api.getTestParameters().then(setParameters).catch(() => {});
    api.getBatches({ limit: "50" }).then((d) => {
      setBatches(d.data.map((b: { batchCode: string; productName: string; status: string }) => ({
        batchCode: b.batchCode,
        productName: b.productName,
        status: b.status,
      })));
    }).catch(() => {});
  }, []);

  // Fetch results when batch or round changes
  useEffect(() => {
    if (!selectedBatch) return;
    api.getTestResults(selectedBatch, round).then((d) => setResults(d.results)).catch(() => setResults([]));
    api.evaluateBatch(selectedBatch, round).then(setEvaluation).catch(() => setEvaluation(null));
  }, [selectedBatch, round]);

  const submitSingleTest = async (paramId: string) => {
    const value = inputValues[paramId];
    if (!value || !selectedBatch) return;
    setSubmitting(paramId);
    try {
      const result = await api.submitTest({ batchCode: selectedBatch, parameterId: paramId, value: parseFloat(value), round });
      setResults((prev) => [...prev.filter((r) => r.parameterId !== paramId), result]);
      toast.success(`${result.paramName}: ${result.pass ? "PASS" : "FAIL"}`, {
        description: `${result.value} ${result.unit} (spec: ${result.specMin}–${result.specMax})`,
      });
      // Refresh evaluation
      api.evaluateBatch(selectedBatch, round).then(setEvaluation).catch(() => {});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(null);
    }
  };

  const handleBulkImport = async () => {
    if (!selectedBatch || !bulkText.trim()) return;
    try {
      // Parse CSV: parameterId,value per line
      const lines = bulkText.trim().split("\n");
      const parsed = lines.map((line) => {
        const [parameterId, valueStr] = line.split(",").map((s) => s.trim());
        return { parameterId, value: parseFloat(valueStr) };
      }).filter((r) => r.parameterId && !isNaN(r.value));
      
      const data = await api.bulkSubmitTests({ batchCode: selectedBatch, round, results: parsed });
      toast.success(`${data.submitted} test results submitted`);
      setBulkOpen(false);
      setBulkText("");
      // Refresh
      api.getTestResults(selectedBatch, round).then((d) => setResults(d.results)).catch(() => {});
      api.evaluateBatch(selectedBatch, round).then(setEvaluation).catch(() => {});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bulk import failed");
    }
  };

  const runVisualInspection = async () => {
    setVisualLoading(true);
    try {
      const result = await api.visualInspect();
      setVisualResult(result);
    } catch { /* ignore */ }
    setVisualLoading(false);
  };

  const passPercent = evaluation && evaluation.totalTests > 0
    ? Math.round((evaluation.passed / evaluation.totalTests) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2"><FlaskConical className="size-6 text-[#6e7e85]" /> Quality Testing</h1>
          <p className="text-muted-foreground mt-1">
            Submit test results, evaluate batches, and run AI visual inspection.
          </p>
        </div>
      </div>

      {/* Batch + Round Selector */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2 space-y-2">
            <Label>Select Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger><SelectValue placeholder="Choose a batch…" /></SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.batchCode} value={b.batchCode}>
                    {b.batchCode} — {b.productName}
                    <Badge variant="outline" className="ml-2 text-xs">{b.status}</Badge>
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)} disabled={!selectedBatch}>
              <Upload className="size-4" /> Bulk Import
            </Button>
          </div>
        </div>
      </Card>

      {selectedBatch && (
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="visual">Visual Inspection</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="m-0 space-y-4">
            {/* Evaluation Summary */}
            {evaluation && evaluation.totalTests > 0 && (
              <Card className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-medium tracking-tight">
                      {evaluation.verdict}
                    </div>
                    <Badge
                      className={
                        evaluation.verdict === "PASS"
                          ? "bg-[#b7cece] text-[#1c0f13] border-transparent"
                          : evaluation.verdict === "FAIL"
                          ? "bg-[#a04249]/15 text-[#a04249] border-transparent"
                          : "border-transparent"
                      }
                    >
                      {evaluation.passed}/{evaluation.totalTests} passed
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <Progress value={passPercent} className="h-3 flex-1" />
                    <span className="text-sm text-muted-foreground">{passPercent}%</span>
                  </div>
                </div>
                {evaluation.failedParameters.length > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Failed: {evaluation.failedParameters.join(", ")}
                  </div>
                )}
              </Card>
            )}

            {/* Test Input + Results Table */}
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Specification</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Enter Value</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.map((p) => {
                    const existing = results.find((r) => r.parameterId === p.id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.paramName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.specMin === 0 ? `≤ ${p.specMax}` : `${p.specMin} – ${p.specMax}`} {p.unit}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.method}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              className="w-24"
                              placeholder="—"
                              value={inputValues[p.id] ?? (existing ? String(existing.value) : "")}
                              onChange={(e) => setInputValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={!inputValues[p.id] || submitting === p.id}
                              onClick={() => submitSingleTest(p.id)}
                            >
                              <Send className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {existing ? `${existing.value} ${p.unit}` : "—"}
                        </TableCell>
                        <TableCell>
                          {existing ? (
                            existing.pass ? (
                              <Badge className="bg-[#b7cece] text-[#1c0f13] border-transparent gap-1">
                                <CheckCircle2 className="size-3" /> Pass
                              </Badge>
                            ) : (
                              <Badge className="bg-[#a04249]/15 text-[#a04249] border-transparent gap-1">
                                <XCircle className="size-3" /> Fail
                              </Badge>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {/* Existing submitted results for this batch */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="size-4" /> Submitted Results — Round {round}
                  </CardTitle>
                  <CardDescription>{results.length} test results recorded</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {results.map((r) => (
                      <div key={r.id} className="rounded-lg border p-3 space-y-1">
                        <div className="text-sm font-medium">{r.paramName}</div>
                        <div className="text-2xl tracking-tight">{r.value} <span className="text-sm text-muted-foreground">{r.unit}</span></div>
                        <div className="text-xs text-muted-foreground">
                          {r.specMin === 0 ? `≤ ${r.specMax}` : `${r.specMin}–${r.specMax}`} {r.unit}
                        </div>
                        {r.pass ? (
                          <Badge className="bg-[#b7cece]/50 text-[#1c0f13] border-transparent text-xs">Complies</Badge>
                        ) : (
                          <Badge className="bg-[#a04249]/15 text-[#a04249] border-transparent text-xs">Fails</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visual Inspection Tab */}
          <TabsContent value="visual" className="m-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-[#6e7e85]" /> AI Visual Defect Detection</CardTitle>
                <CardDescription>VisionPharma v2.4 — Upload tablet images for automated surface defect analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={runVisualInspection} disabled={visualLoading} variant="outline">
                  <Upload className="size-4" /> {visualLoading ? "Analyzing…" : "Run Analysis (Simulated)"}
                </Button>

                {visualResult && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="rounded-md border p-4">
                      <div className="text-xs text-muted-foreground">Model</div>
                      <div className="font-medium mt-1">{visualResult.model}</div>
                      <div className="text-xs text-muted-foreground mt-1">{visualResult.analysisTime}</div>
                    </div>
                    <div className="rounded-md border p-4">
                      <div className="text-xs text-muted-foreground">Defects</div>
                      <div className="text-2xl font-medium mt-1">{visualResult.defectsFound}</div>
                    </div>
                    <div className="rounded-md border p-4">
                      <div className="text-xs text-muted-foreground">Verdict</div>
                      <Badge className={
                        visualResult.verdict === "PASS" ? "bg-[#b7cece] text-[#1c0f13] mt-1 border-transparent" :
                        visualResult.verdict === "REJECT" ? "bg-[#a04249]/15 text-[#a04249] mt-1 border-transparent" :
                        "bg-[#bbbac6]/40 text-[#1c0f13] mt-1 border-transparent"
                      }>{visualResult.verdict}</Badge>
                    </div>
                    {visualResult.defects.map((d, i) => (
                      <div key={i} className="rounded-md border p-4 space-y-1">
                        <div className="font-medium">{d.type}</div>
                        <div className="text-sm text-muted-foreground">Confidence: {(d.confidence * 100).toFixed(0)}%</div>
                        <Badge className={
                          d.severity === "High" ? "bg-[#a04249]/15 text-[#a04249] border-transparent" :
                          d.severity === "Medium" ? "bg-[#bbbac6]/40 text-[#1c0f13] border-transparent" :
                          "bg-[#b7cece]/50 text-[#1c0f13] border-transparent"
                        }>{d.severity}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedBatch && (
        <Card className="p-12 text-center text-muted-foreground">
          <FlaskConical className="size-12 mx-auto mb-4 opacity-30" />
          <p>Select a batch above to begin quality testing.</p>
        </Card>
      )}

      {/* Bulk Import Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Import Test Results</DialogTitle>
            <DialogDescription>
              Paste CSV data with format: <code>parameterId,value</code> (one per line).<br />
              Example: <code>tp-ph,5.8</code>
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="w-full h-40 rounded-md border p-3 text-sm font-mono bg-background"
            placeholder={`tp-ph,5.8\ntp-potency,99.2\ntp-purity,99.7\ntp-dissolution,86.4\ntp-moisture,0.8\ntp-related,0.18\ntp-microbial,10`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkImport}>Import {bulkText.trim().split("\n").length} results</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
