import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { toast } from "sonner";
import { Save, RotateCcw, Trash2, Plus, KeyRound, CheckCircle2 } from "lucide-react";

interface Props {
  dark: boolean;
  onToggleDark: (next: boolean) => void;
}

type Settings = {
  fullName: string;
  email: string;
  role: string;
  language: string;
  timezone: string;
  density: "comfortable" | "compact";
  dark: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyCritical: boolean;
  notifyDigest: "off" | "daily" | "weekly";
  tempUnit: "C" | "F";
  pressureUnit: "atm" | "kPa";
  autoApprove: boolean;
  retentionDays: number;
  twoFactor: boolean;
  sessionTimeout: number;
};

const DEFAULTS: Omit<Settings, "dark"> = {
  fullName: "Dr. Anika Rao",
  email: "anika.rao@pharmaq.io",
  role: "QA Manager",
  language: "en-IN",
  timezone: "Asia/Kolkata",
  density: "comfortable",
  notifyEmail: true,
  notifyPush: true,
  notifyCritical: true,
  notifyDigest: "daily",
  tempUnit: "C",
  pressureUnit: "atm",
  autoApprove: false,
  retentionDays: 365,
  twoFactor: true,
  sessionTimeout: 30,
};

export function SettingsScreen({ dark, onToggleDark }: Props) {
  const { user, updateUser } = useAuth();
  
  const startingSettings = {
    ...DEFAULTS,
    fullName: user?.name || DEFAULTS.fullName,
    email: user?.email || DEFAULTS.email,
    role: user?.role || DEFAULTS.role,
    dark
  };

  const [s, setS] = useState<Settings>(startingSettings);
  const [initial, setInitial] = useState<Settings>(startingSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial.density === "compact") {
      document.documentElement.classList.add("compact-ui");
    } else {
      document.documentElement.classList.remove("compact-ui");
    }
  }, [initial.density]);
  const [apiKeys, setApiKeys] = useState([
    { id: "k_live_4f2…a91", label: "Production ingestion", created: "2026-02-14" },
    { id: "k_test_8c1…b30", label: "Lab integration", created: "2026-04-02" },
  ]);

  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    if (k === "dark") onToggleDark(v as boolean);
  };

  const save = () => {
    setInitial(s);
    updateUser({
      name: s.fullName,
      email: s.email,
      role: s.role,
    });
    toast.success("Settings saved", {
      description: "Your preferences have been applied across the workspace.",
    });
  };

  const reset = () => {
    setS(initial);
    toast("Changes discarded");
  };

  const resetDefaults = () => {
    const next = { ...DEFAULTS, dark: s.dark };
    setS(next);
    setInitial(next);
    toast.success("Restored to defaults");
  };

  const addKey = () => {
    const id = `k_live_${Math.random().toString(36).slice(2, 5)}…${Math.random()
      .toString(36)
      .slice(2, 5)}`;
    setApiKeys((prev) => [
      ...prev,
      { id, label: "New API key", created: new Date().toISOString().slice(0, 10) },
    ]);
    toast.success("API key generated", { description: id });
  };

  const removeKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    toast("Key revoked");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ avatar: reader.result as string });
        toast.success("Profile photo updated");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, notifications, lab preferences and security.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Badge variant="outline" className="gap-1.5">
              <span className="size-2 rounded-full bg-[#bbbac6]" /> Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={reset} disabled={!dirty}>
            <RotateCcw className="size-4" /> Discard
          </Button>
          <Button onClick={save} disabled={!dirty}>
            <Save className="size-4" /> Save changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="lab">Lab Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 m-0">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>This information is visible to other QA reviewers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  {user?.avatar && <AvatarImage src={user.avatar} className="object-cover" />}
                  <AvatarFallback className="bg-[#b7cece] text-[#1c0f13] text-lg">
                    {initials(s.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload photo</Button>
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Photo removed")}>Remove</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full name">
                  <Input value={s.fullName} onChange={(e) => update("fullName", e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={s.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </Field>
                <Field label="Role">
                  <Select value={s.role} onValueChange={(v) => update("role", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QA Manager">QA Manager</SelectItem>
                      <SelectItem value="QA Analyst">QA Analyst</SelectItem>
                      <SelectItem value="Lab Technician">Lab Technician</SelectItem>
                      <SelectItem value="Authorized Person">Authorized Person</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Language">
                  <Select value={s.language} onValueChange={(v) => update("language", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-IN">English (India)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="de-DE">Deutsch</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                      <SelectItem value="ja-JP">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Timezone">
                  <Select value={s.timezone} onValueChange={(v) => update("timezone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 m-0">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose how Kiyo looks on this device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Row
                title="Dark mode"
                description="Reduce eye strain in low-light environments."
              >
                <Switch
                  checked={s.dark}
                  onCheckedChange={(v) => update("dark", v)}
                />
              </Row>
              <Separator />
              <Row title="Density" description="Compact mode shows more rows per screen.">
                <Select
                  value={s.density}
                  onValueChange={(v: "comfortable" | "compact") => update("density", v)}
                >
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 m-0">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Pick where and when you want to be alerted.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Row title="Email alerts" description="Send important alerts to your inbox.">
                <Switch
                  checked={s.notifyEmail}
                  onCheckedChange={(v) => update("notifyEmail", v)}
                />
              </Row>
              <Separator />
              <Row title="Push notifications" description="Browser and mobile push.">
                <Switch
                  checked={s.notifyPush}
                  onCheckedChange={(v) => update("notifyPush", v)}
                />
              </Row>
              <Separator />
              <Row
                title="Critical-only override"
                description="Bypass quiet hours for critical environmental deviations."
              >
                <Switch
                  checked={s.notifyCritical}
                  onCheckedChange={(v) => update("notifyCritical", v)}
                />
              </Row>
              <Separator />
              <Row title="Digest" description="Summary of activity across batches.">
                <Select
                  value={s.notifyDigest}
                  onValueChange={(v: Settings["notifyDigest"]) => update("notifyDigest", v)}
                >
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab" className="space-y-6 m-0">
          <Card>
            <CardHeader>
              <CardTitle>Lab Preferences</CardTitle>
              <CardDescription>Defaults applied to new batches and reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Temperature unit">
                  <Select
                    value={s.tempUnit}
                    onValueChange={(v: Settings["tempUnit"]) => update("tempUnit", v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">Celsius (°C)</SelectItem>
                      <SelectItem value="F">Fahrenheit (°F)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Pressure unit">
                  <Select
                    value={s.pressureUnit}
                    onValueChange={(v: Settings["pressureUnit"]) => update("pressureUnit", v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atm">Atmospheres (atm)</SelectItem>
                      <SelectItem value="kPa">Kilopascals (kPa)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Separator />

              <Row
                title="Auto-approve passing batches"
                description="Batches with all parameters in spec are released without manual review."
              >
                <Switch
                  checked={s.autoApprove}
                  onCheckedChange={(v) => update("autoApprove", v)}
                />
              </Row>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div>Data retention</div>
                    <p className="text-muted-foreground text-sm">
                      Raw sensor data is kept for this many days before archival.
                    </p>
                  </div>
                  <Badge variant="outline">{s.retentionDays} days</Badge>
                </div>
                <Slider
                  value={[s.retentionDays]}
                  min={30}
                  max={730}
                  step={30}
                  onValueChange={(v) => update("retentionDays", v[0])}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 m-0">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Protect your account and signed records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Row
                title="Two-factor authentication"
                description="Required for e-signatures on CoA documents."
              >
                <Switch
                  checked={s.twoFactor}
                  onCheckedChange={(v) => update("twoFactor", v)}
                />
              </Row>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div>Session timeout</div>
                    <p className="text-muted-foreground text-sm">
                      Sign out automatically after this many minutes of inactivity.
                    </p>
                  </div>
                  <Badge variant="outline">{s.sessionTimeout} min</Badge>
                </div>
                <Slider
                  value={[s.sessionTimeout]}
                  min={5}
                  max={120}
                  step={5}
                  onValueChange={(v) => update("sessionTimeout", v[0])}
                />
              </div>
              <Separator />
              <Row
                title="Password"
                description="Last changed 2026-03-04. We recommend rotating every 90 days."
              >
                <Button variant="outline">
                  <KeyRound className="size-4" /> Change password
                </Button>
              </Row>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#a04249]">Danger zone</CardTitle>
              <CardDescription>Irreversible actions affecting your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Row
                title="Restore defaults"
                description="Reset all settings on this page to factory defaults."
              >
                <Button variant="outline" onClick={resetDefaults}>
                  <RotateCcw className="size-4" /> Restore defaults
                </Button>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6 m-0">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Use these to authenticate IoT sensors and lab equipment.
                </CardDescription>
              </div>
              <Button onClick={addKey}>
                <Plus className="size-4" /> Generate key
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiKeys.length === 0 && (
                <div className="text-muted-foreground text-sm py-6 text-center border border-dashed rounded-md">
                  No keys yet. Generate one to connect a device.
                </div>
              )}
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#6e7e85] shrink-0" />
                      <span className="truncate">{k.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {k.id} · created {k.created}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Revoke key"
                    onClick={() => removeKey(k.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div>{title}</div>
        <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
