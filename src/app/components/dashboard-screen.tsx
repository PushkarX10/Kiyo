import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AlertTriangle, CheckCircle2, Beaker, Thermometer, TrendingUp, Activity } from "lucide-react";
import { api } from "../lib/api";

interface SensorReading {
  sensorId: string;
  type: string;
  location: string;
  unit: string;
  value: number;
  timestamp: string;
  safe: [number, number];
  warn: [number, number];
  status: string;
}

interface Alert {
  id: string;
  severity: string;
  message: string;
  acknowledged: boolean;
  timestamp: string;
}

interface BatchStats {
  total: number;
  passed: number;
  failed: number;
  testing: number;
  pending: number;
  passRate: string;
}

function Kpi({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneMap = {
    default: "bg-primary/15 text-[#1c0f13] dark:text-[#b7cece]",
    success: "bg-[#b7cece]/40 text-[#1c0f13] dark:bg-[#b7cece]/15 dark:text-[#b7cece]",
    warning: "bg-[#bbbac6]/40 text-[#1c0f13] dark:bg-[#bbbac6]/15 dark:text-[#bbbac6]",
    danger: "bg-[#a04249]/15 text-[#a04249] dark:text-[#c46e75]",
  } as const;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl tracking-tight">{value}</div>
            {delta && (
              <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="size-3" /> {delta}
              </div>
            )}
          </div>
          <div className={`size-10 rounded-lg grid place-items-center ${toneMap[tone]}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InlineLineChart({
  data,
  domain,
  safe,
  warn,
  stroke,
}: {
  data: { t: string; v: number }[];
  domain: [number, number];
  safe: [number, number];
  warn: [number, number];
  stroke: string;
}) {
  const W = 320;
  const H = 160;
  const padL = 32;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const xFor = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const yFor = (v: number) =>
    padT + (1 - (v - domain[0]) / (domain[1] - domain[0])) * innerH;
  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(d.v).toFixed(1)}`)
    .join(" ");
  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) =>
    domain[0] + ((domain[1] - domain[0]) * i) / yTicks
  );
  const xTickStep = Math.max(1, Math.floor((data.length - 1) / 5));

  const band = (a: number, b: number, color: string) => {
    const y1 = yFor(b);
    const y2 = yFor(a);
    return { x: padL, y: y1, width: innerW, height: Math.max(0, y2 - y1), fill: color };
  };
  const bands = [
    band(domain[0], warn[0], "rgba(160,66,73,0.08)"),
    band(warn[0], safe[0], "rgba(187,186,198,0.30)"),
    band(safe[0], safe[1], "rgba(183,206,206,0.40)"),
    band(safe[1], warn[1], "rgba(187,186,198,0.30)"),
    band(warn[1], domain[1], "rgba(160,66,73,0.08)"),
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
      {bands.map((b, i) => (
        <rect key={`band-${i}`} x={b.x} y={b.y} width={b.width} height={b.height} fill={b.fill} />
      ))}
      {ticks.map((t, i) => (
        <g key={`yt-${i}`}>
          <line
            x1={padL}
            x2={W - padR}
            y1={yFor(t)}
            y2={yFor(t)}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <text
            x={padL - 4}
            y={yFor(t) + 3}
            textAnchor="end"
            fontSize={9}
            fill="var(--muted-foreground)"
          >
            {t.toFixed(domain[1] < 10 ? 2 : 0)}
          </text>
        </g>
      ))}
      {data.map((d, i) =>
        i % xTickStep === 0 ? (
          <text
            key={`xt-${i}`}
            x={xFor(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted-foreground)"
          >
            {d.t}
          </text>
        ) : null
      )}
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}

function SensorChart({
  title,
  unit,
  data,
  safe,
  warn,
  domain,
  stroke,
}: {
  title: string;
  unit: string;
  data: { t: string; v: number }[];
  safe: [number, number];
  warn: [number, number];
  domain: [number, number];
  stroke: string;
}) {
  const current = data.length > 0 ? data[data.length - 1].v : 0;
  const status =
    current < safe[0] || current > safe[1]
      ? current < warn[0] || current > warn[1]
        ? "critical"
        : "warning"
      : "safe";
  const statusColor =
    status === "safe"
      ? "bg-[#6e7e85]"
      : status === "warning"
      ? "bg-[#bbbac6]"
      : "bg-[#a04249]";

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Current {current.toFixed(2)} {unit}
          </CardDescription>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`size-2 rounded-full ${statusColor}`} /> {status}
        </span>
      </CardHeader>
      <CardContent className="h-44 pt-0">
        <InlineLineChart data={data} domain={domain} safe={safe} warn={warn} stroke={stroke} />
      </CardContent>
    </Card>
  );
}

export function DashboardScreen() {
  const [stats, setStats] = useState<BatchStats>({ total: 0, passed: 0, failed: 0, testing: 0, pending: 0, passRate: "0" });
  const [alertCount, setAlertCount] = useState({ total: 0, critical: 0 });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastSync, setLastSync] = useState("—");
  const wsRef = useRef<WebSocket | null>(null);

  // Sensor data for charts — keep last 30 readings per sensor
  const [tempData, setTempData] = useState<{ t: string; v: number }[]>([]);
  const [humData, setHumData] = useState<{ t: string; v: number }[]>([]);
  const [presData, setPresData] = useState<{ t: string; v: number }[]>([]);
  const [currentTemp, setCurrentTemp] = useState(0);

  // Load initial data
  useEffect(() => {
    api.getBatchStats().then(setStats).catch(() => {});
    api.getAlertCount().then(setAlertCount).catch(() => {});
    api.getAlerts({ limit: "8" }).then((d) => setAlerts(d.data)).catch(() => {});
  }, []);

  // WebSocket connection for real-time sensor data
  const handleWsMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "sensor_update" && Array.isArray(msg.readings)) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

        // Find specific sensors
        const temp = msg.readings.find((r: SensorReading) => r.sensorId === "temp-lab1");
        const hum = msg.readings.find((r: SensorReading) => r.sensorId === "hum-lab1");
        const pres = msg.readings.find((r: SensorReading) => r.sensorId === "press-cr1");

        if (temp) {
          setCurrentTemp(temp.value);
          setTempData((prev) => [...prev.slice(-59), { t: timeStr, v: temp.value }]);
        }
        if (hum) setHumData((prev) => [...prev.slice(-59), { t: timeStr, v: hum.value }]);
        if (pres) setPresData((prev) => [...prev.slice(-59), { t: timeStr, v: pres.value }]);

        setLastSync(`${Math.floor((Date.now() - new Date(msg.timestamp).getTime()) / 1000)}s ago`);
      }
    } catch { /* ignore parse errors */ }
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001/ws/sensors");
    wsRef.current = ws;
    ws.onmessage = handleWsMessage;
    ws.onerror = () => console.log("[WS] Connection error — is the server running?");
    ws.onclose = () => console.log("[WS] Disconnected");

    return () => {
      ws.close();
    };
  }, [handleWsMessage]);

  // Seed initial chart data from API
  useEffect(() => {
    const seed = async () => {
      try {
        const [tempH, humH, presH] = await Promise.all([
          api.getSensorHistory("temp-lab1", 1),
          api.getSensorHistory("hum-lab1", 1),
          api.getSensorHistory("press-cr1", 1),
        ]);
        const format = (data: { data: Array<{ timestamp: string; value: number }> }) =>
          data.data.slice(-60).map((d: { timestamp: string; value: number }) => {
            const dt = new Date(d.timestamp);
            return { t: `${dt.getHours()}:${dt.getMinutes().toString().padStart(2, "0")}`, v: d.value };
          });
        setTempData(format(tempH));
        setHumData(format(humH));
        setPresData(format(presH));
        if (tempH.data.length > 0) setCurrentTemp(tempH.data[tempH.data.length - 1].value);
      } catch { /* server may not be running */ }
    };
    seed();
  }, []);

  const acknowledgeAlert = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
      setAlertCount((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1>Live Quality &amp; Environment Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Real-time IoT telemetry and quality KPIs across all production lines.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <span className="size-2 rounded-full bg-[#6e7e85] animate-pulse" />
          Live · synced {lastSync}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Batches Tested" value={stats.total.toLocaleString()} delta={`${stats.passRate}% pass rate`} icon={Beaker} />
        <Kpi label="Active Alerts" value={String(alertCount.total)} delta={`${alertCount.critical} critical`} icon={AlertTriangle} tone="danger" />
        <Kpi label="Average Pass Rate" value={`${stats.passRate}%`} delta={`${stats.passed} passed`} icon={CheckCircle2} tone="success" />
        <Kpi label="Current Lab Temp" value={`${currentTemp.toFixed(1)} °C`} delta="Lab 1" icon={Thermometer} tone="default" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SensorChart
            title="Temperature"
            unit="°C"
            data={tempData}
            safe={[20, 23]}
            warn={[19, 24]}
            domain={[17, 26]}
            stroke="#6e7e85"
          />
          <SensorChart
            title="Humidity"
            unit="%"
            data={humData}
            safe={[40, 55]}
            warn={[35, 60]}
            domain={[30, 65]}
            stroke="#6e7e85"
          />
          <SensorChart
            title="Pressure"
            unit="atm"
            data={presData}
            safe={[1.005, 1.02]}
            warn={[1.0, 1.025]}
            domain={[0.995, 1.03]}
            stroke="#1c0f13"
          />
        </div>

        <Card className="xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" /> Recent Alerts
            </CardTitle>
            <CardDescription>Environmental and quality deviations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a) => {
              const tone =
                a.severity === "critical"
                  ? "bg-[#a04249]"
                  : a.severity === "warning"
                  ? "bg-[#bbbac6]"
                  : "bg-[#6e7e85]";
              return (
                <div key={a.id} className="flex gap-3 items-start">
                  <span className={`mt-1.5 size-2 rounded-full shrink-0 ${tone}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{a.message}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {a.severity.toUpperCase()}
                      {!a.acknowledged && (
                        <Button variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={() => acknowledgeAlert(a.id)}>
                          Ack
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
