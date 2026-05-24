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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog";
import {
  Truck, Package, AlertTriangle, Thermometer, ArrowUp, ArrowDown, Plus, MapPin, Check, Star,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

interface Shipment {
  id: string;
  shipCode: string;
  product: string;
  supplier: string;
  origin: string;
  destination: string;
  eta: string;
  status: string;
  progress: number;
  qty: string;
  coldChain: boolean;
  tempOk: boolean;
}

interface Supplier {
  id: string;
  name: string;
  country: string;
  gmp: string;
  rating: number;
  onTime: number;
  openOrders: number;
}

interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  onHand: number;
  reorder: number;
  cap: number;
  unit: string;
  lot: string;
  expires: string;
}

interface SupplyStats {
  inTransit: number;
  delayed: number;
  lowStock: number;
  coldBreach: number;
}

const statusColors: Record<string, string> = {
  "In transit": "bg-[#b7cece]/50 text-[#1c0f13] border-transparent",
  "At customs": "bg-[#bbbac6]/40 text-[#1c0f13] border-transparent",
  Delayed: "bg-[#a04249]/15 text-[#a04249] border-transparent",
  Delivered: "bg-[#b7cece] text-[#1c0f13] border-transparent",
  Scheduled: "bg-[#e2e2e2] text-[#1c0f13] border-transparent",
};

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; tone: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-sm">{label}</div>
          <div className="text-3xl tracking-tight mt-1">{value}</div>
        </div>
        <div className={`size-10 rounded-lg grid place-items-center ${tone}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SupplyScreen() {
  const [stats, setStats] = useState<SupplyStats>({ inTransit: 0, delayed: 0, lowStock: 0, coldBreach: 0 });
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [poOpen, setPoOpen] = useState(false);
  const [newPO, setNewPO] = useState({
    product: "", supplier: "", origin: "", destination: "Mumbai DC", qty: "", eta: "", coldChain: false,
  });

  const load = () => {
    api.getSupplyStats().then(setStats).catch(() => {});
    api.getShipments().then((d) => setShipments(d.data)).catch(() => {});
    api.getSuppliers().then(setSuppliers).catch(() => {});
    api.getInventory().then(setInventory).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const createPO = async () => {
    if (!newPO.product || !newPO.supplier || !newPO.qty) {
      toast.error("Product, supplier, and quantity are required"); return;
    }
    try {
      const ship = await api.createShipment(newPO);
      toast.success(`Purchase Order ${ship.shipCode} created`, { description: ship.product });
      setPoOpen(false);
      setNewPO({ product: "", supplier: "", origin: "", destination: "Mumbai DC", qty: "", eta: "", coldChain: false });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create PO");
    }
  };

  const markDelivered = async (id: string) => {
    try {
      await api.markDelivered(id);
      toast.success("Shipment marked as delivered");
      load();
    } catch { /* ignore */ }
  };

  const acknowledgeBreach = async (id: string) => {
    try {
      await api.acknowledgeBreach(id);
      toast.success("Temperature excursion acknowledged");
      load();
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2"><Truck className="size-6 text-[#6e7e85]" /> Supply Chain</h1>
          <p className="text-muted-foreground mt-1">
            Track shipments, manage suppliers, and monitor inventory levels.
          </p>
        </div>
        <Dialog open={poOpen} onOpenChange={setPoOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" /> New Purchase Order</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>Schedule a new incoming shipment</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Product *</Label>
                <Input placeholder="e.g. Paracetamol API" value={newPO.product} onChange={(e) => setNewPO({ ...newPO, product: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={newPO.supplier} onValueChange={(v) => setNewPO({ ...newPO, supplier: v })}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input placeholder="e.g. 2,400 kg" value={newPO.qty} onChange={(e) => setNewPO({ ...newPO, qty: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Origin</Label>
                <Input placeholder="e.g. Wuhan, CN" value={newPO.origin} onChange={(e) => setNewPO({ ...newPO, origin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ETA</Label>
                <Input type="date" value={newPO.eta} onChange={(e) => setNewPO({ ...newPO, eta: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <input type="checkbox" id="cold-chain" checked={newPO.coldChain} onChange={(e) => setNewPO({ ...newPO, coldChain: e.target.checked })} className="accent-[#6e7e85]" />
                <label htmlFor="cold-chain" className="text-sm">Requires cold-chain monitoring</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPoOpen(false)}>Cancel</Button>
              <Button onClick={createPO}>Create PO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Shipments In Transit" value={stats.inTransit} icon={Truck} tone="bg-[#b7cece]/30 text-[#1c0f13]" />
        <Kpi label="Delayed" value={stats.delayed} icon={AlertTriangle} tone="bg-[#a04249]/15 text-[#a04249]" />
        <Kpi label="Low Stock Items" value={stats.lowStock} icon={ArrowDown} tone="bg-[#bbbac6]/30 text-[#1c0f13]" />
        <Kpi label="Cold-Chain Breaches" value={stats.coldBreach} icon={Thermometer} tone="bg-[#a04249]/15 text-[#a04249]" />
      </div>

      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="m-0">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.shipCode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {s.coldChain && <Thermometer className={`size-3 ${s.tempOk ? "text-[#6e7e85]" : "text-[#a04249]"}`} />}
                        {s.product}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.supplier}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><MapPin className="size-3" /> {s.origin} → {s.destination}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.eta}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={s.progress} className="h-1.5 flex-1" />
                        <span className="text-xs w-8 text-right">{s.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[s.status] || ""}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {s.status !== "Delivered" && s.status !== "Scheduled" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markDelivered(s.id)}>
                            <Check className="size-3" /> Deliver
                          </Button>
                        )}
                        {s.coldChain && !s.tempOk && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-[#a04249]" onClick={() => acknowledgeBreach(s.id)}>
                            Ack Breach
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.country} · {s.openOrders} open orders</div>
                    </div>
                    <Badge
                      className={
                        s.gmp === "Certified" ? "bg-[#b7cece]/50 text-[#1c0f13] border-transparent" :
                        s.gmp === "Pending" ? "bg-[#bbbac6]/40 text-[#1c0f13] border-transparent" :
                        "bg-[#a04249]/15 text-[#a04249] border-transparent"
                      }
                    >
                      GMP: {s.gmp}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                      <div className="font-medium flex items-center justify-center gap-1">
                        <Star className="size-3 text-[#bbbac6]" />{s.rating.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">On-Time</div>
                      <div className="font-medium">{s.onTime}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                      <div className="font-medium">{s.openOrders}</div>
                    </div>
                  </div>
                  <Progress value={s.onTime} className="h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="m-0">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>On Hand</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Lot / Expires</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const pct = Math.round((item.onHand / item.cap) * 100);
                  const isLow = item.onHand < item.reorder;
                  return (
                    <TableRow key={item.sku}>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Package className="size-3 text-muted-foreground" />
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                      <TableCell>
                        <span className={isLow ? "text-[#a04249] font-medium" : ""}>
                          {item.onHand.toLocaleString()} {item.unit}
                        </span>
                        {isLow && <ArrowDown className="inline size-3 text-[#a04249] ml-1" />}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.cap.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs w-8 text-right">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.lot} · {item.expires}</TableCell>
                      <TableCell className="text-right">
                        {isLow && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                            setNewPO({ ...newPO, product: item.name, qty: `${item.reorder} ${item.unit}` });
                            setPoOpen(true);
                          }}>
                            <ArrowUp className="size-3" /> Reorder
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
