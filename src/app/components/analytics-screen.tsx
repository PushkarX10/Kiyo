import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Sparkles, AlertTriangle, TrendingUp, ShieldAlert, Building2, Upload } from "lucide-react";
import { api } from "../lib/api";

interface Anomaly {
  batchCode: string;
  productName: string;
  manufacturer: string;
  status: string;
  deviationScore: number;
  flags: string[];
  recommendation: string;
}

interface RiskScore {
  batchCode: string;
  productName: string;
  manufacturer: string;
  riskScore: number;
  riskLevel: string;
  factors: string[];
}

interface SupplierRisk {
  name: string;
  country: string;
  gmpStatus: string;
  onTimeRate: number;
  rating: number;
  riskScore: number;
  riskLevel: string;
}

interface ShelfLife {
  batchCode: string;
  productName: string;
  mfgDate: string;
  expiryDate: string;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  degradationRate: string;
  predictedShelfLifeDays: number;
  confidenceInterval: number[];
  storageConditions: string;
  model: string;
}

interface VisualResult {
  model: string;
  analysisTime: string;
  defectsFound: number;
  defects: Array<{ type: string; confidence: number; severity: string }>;
  verdict: string;
}

const recColors: Record<string, string> = {
  INVESTIGATE: "bg-[#a04249]/15 text-[#a04249] dark:bg-[#a04249]/25 dark:text-[#c46e75] border-transparent",
  MONITOR: "bg-[#bbbac6]/40 text-[#1c0f13] dark:bg-[#bbbac6]/15 dark:text-[#bbbac6] border-transparent",
  "LOW RISK": "bg-[#b7cece]/50 text-[#1c0f13] dark:bg-[#b7cece]/15 dark:text-[#b7cece] border-transparent",
};

const riskColors: Record<string, string> = {
  HIGH: "bg-[#a04249]/15 text-[#a04249] border-transparent",
  MEDIUM: "bg-[#bbbac6]/40 text-[#1c0f13] border-transparent",
  LOW: "bg-[#b7cece]/50 text-[#1c0f13] border-transparent",
};

export function AnalyticsScreen() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [supplierRisk, setSupplierRisk] = useState<SupplierRisk[]>([]);
  const [shelfLife, setShelfLife] = useState<ShelfLife | null>(null);
  const [shelfBatch, setShelfBatch] = useState("B-88492");
  const [visualResult, setVisualResult] = useState<VisualResult | null>(null);
  const [visualLoading, setVisualLoading] = useState(false);

  useEffect(() => {
    api.getAnomalies().then((d) => setAnomalies(d.data)).catch(() => {});
    api.getRiskScores().then((d) => setRiskScores(d.data)).catch(() => {});
    api.getSupplierRisk().then((d) => setSupplierRisk(d)).catch(() => {});
  }, []);

  const fetchShelfLife = () => {
    api.getShelfLife(shelfBatch).then(setShelfLife).catch(() => setShelfLife(null));
  };

  const runVisualInspection = () => {
    setVisualLoading(true);
    api.visualInspect().then((d) => { setVisualResult(d); setVisualLoading(false); }).catch(() => setVisualLoading(false));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2"><Sparkles className="size-6 text-[#6e7e85]" /> AI/ML Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Anomaly detection, predictive shelf-life, risk scoring, and visual defect analysis.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <span className="size-2 rounded-full bg-[#b7cece]" /> Engine v2.4
        </Badge>
      </div>

      <Tabs defaultValue="anomalies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="risk">Batch Risk Scores</TabsTrigger>
          <TabsTrigger value="supplier">Supplier Risk</TabsTrigger>
          <TabsTrigger value="shelf-life">Shelf-Life Predictor</TabsTrigger>
          <TabsTrigger value="visual">Visual Inspection</TabsTrigger>
        </TabsList>

        {/* Anomaly Detection */}
        <TabsContent value="anomalies" className="m-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4" /> Flagged Batches
              </CardTitle>
              <CardDescription>Batches with deviations from historical norms</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deviation Score</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomalies.map((a) => (
                    <TableRow key={a.batchCode}>
                      <TableCell className="font-mono">{a.batchCode}</TableCell>
                      <TableCell>{a.productName}</TableCell>
                      <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={a.deviationScore * 100} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-9 text-right">
                            {(a.deviationScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {a.flags.length > 0 ? (
                          <div className="text-xs text-muted-foreground">{a.flags.join("; ")}</div>
                        ) : <span className="text-xs text-muted-foreground">No flags</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={recColors[a.recommendation] || ""}>{a.recommendation}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {anomalies.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No anomalies detected</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Risk Scores */}
        <TabsContent value="risk" className="m-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="size-4" /> Risk Assessment</CardTitle>
              <CardDescription>Combined risk scores from test data and historical performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Factors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskScores.slice(0, 10).map((r) => (
                    <TableRow key={r.batchCode}>
                      <TableCell className="font-mono">{r.batchCode}</TableCell>
                      <TableCell>{r.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{r.manufacturer}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={r.riskScore * 100} className="h-2 flex-1" />
                          <span className="text-xs w-9 text-right">{(r.riskScore * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={riskColors[r.riskLevel] || ""}>{r.riskLevel}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">{r.factors.join(", ") || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Risk */}
        <TabsContent value="supplier" className="m-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="size-4" /> Supplier Risk Heatmap</CardTitle>
              <CardDescription>Historical performance-based risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {supplierRisk.map((s) => (
                  <div key={s.name} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.country} · GMP: {s.gmpStatus}</div>
                      </div>
                      <Badge className={riskColors[s.riskLevel] || ""}>{s.riskLevel}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                        <div className="font-medium">{s.rating.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">On-Time</div>
                        <div className="font-medium">{s.onTimeRate}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Risk</div>
                        <div className="font-medium">{(s.riskScore * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    <Progress value={(1 - s.riskScore) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shelf-Life Predictor */}
        <TabsContent value="shelf-life" className="m-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="size-4" /> Predictive Shelf-Life Calculator</CardTitle>
              <CardDescription>Arrhenius-based accelerated stability model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="space-y-2 flex-1 max-w-xs">
                  <label className="text-sm text-muted-foreground">Batch Code</label>
                  <Input value={shelfBatch} onChange={(e) => setShelfBatch(e.target.value)} placeholder="e.g. B-88492" />
                </div>
                <Button onClick={fetchShelfLife}>Calculate</Button>
              </div>

              {shelfLife && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="text-sm text-muted-foreground">Product</div>
                    <div className="font-medium">{shelfLife.productName}</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Mfg Date:</span> {shelfLife.mfgDate}</div>
                      <div><span className="text-muted-foreground">Expiry:</span> {shelfLife.expiryDate}</div>
                      <div><span className="text-muted-foreground">Total:</span> {shelfLife.totalDays} days</div>
                      <div><span className="text-muted-foreground">Elapsed:</span> {shelfLife.elapsedDays} days</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="text-sm text-muted-foreground">Prediction</div>
                    <div className="text-3xl font-medium tracking-tight">{shelfLife.predictedShelfLifeDays} <span className="text-base text-muted-foreground">days</span></div>
                    <div className="text-sm space-y-1">
                      <div><span className="text-muted-foreground">Remaining:</span> {shelfLife.remainingDays} days</div>
                      <div><span className="text-muted-foreground">Degradation:</span> {shelfLife.degradationRate}</div>
                      <div><span className="text-muted-foreground">Confidence:</span> {shelfLife.confidenceInterval[0]}–{shelfLife.confidenceInterval[1]} days</div>
                      <div><span className="text-muted-foreground">Storage:</span> {shelfLife.storageConditions}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">{shelfLife.model}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Inspection */}
        <TabsContent value="visual" className="m-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-[#6e7e85]" /> Visual Defect Detection</CardTitle>
              <CardDescription>AI vision model — VisionPharma v2.4 — analyzes surface defects from uploaded images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runVisualInspection} disabled={visualLoading} variant="outline">
                <Upload className="size-4" /> {visualLoading ? "Analyzing…" : "Run Mock Analysis"}
              </Button>

              {visualResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-md border p-4">
                    <div className="text-xs text-muted-foreground">Model</div>
                    <div className="mt-1 font-medium">{visualResult.model}</div>
                    <div className="text-xs text-muted-foreground mt-1">Analysis: {visualResult.analysisTime}</div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="text-xs text-muted-foreground">Defects Found</div>
                    <div className="mt-1 text-2xl font-medium">{visualResult.defectsFound}</div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="text-xs text-muted-foreground">Verdict</div>
                    <div className="mt-1">
                      <Badge className={
                        visualResult.verdict === "PASS" ? "bg-[#b7cece] text-[#1c0f13] border-transparent" :
                        visualResult.verdict === "REJECT" ? "bg-[#a04249]/15 text-[#a04249] border-transparent" :
                        "bg-[#bbbac6]/40 text-[#1c0f13] border-transparent"
                      }>{visualResult.verdict}</Badge>
                    </div>
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
    </div>
  );
}
