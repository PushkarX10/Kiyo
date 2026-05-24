import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Activity, LogIn, Eye, EyeOff, Shield } from "lucide-react";

const demoAccounts = [
  { email: "admin@kiyo.io", password: "admin123", role: "Admin", color: "bg-[#1c0f13] text-white" },
  { email: "qa.manager@kiyo.io", password: "qa123", role: "QA Manager", color: "bg-[#6e7e85] text-white" },
  { email: "lab.tech@kiyo.io", password: "lab123", role: "Lab Technician", color: "bg-[#b7cece] text-[#1c0f13]" },
  { email: "auditor@kiyo.io", password: "audit123", role: "Auditor", color: "bg-[#bbbac6] text-[#1c0f13]" },
  { email: "supplier@kiyo.io", password: "supplier123", role: "Supplier", color: "bg-[#e2e2e2] text-[#1c0f13]" },
  { email: "inspector@kiyo.io", password: "inspect123", role: "Field Inspector", color: "bg-[#a04249] text-white" },
];

export function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setLocalError(msg);
    }
  };

  const quickLogin = async (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setLocalError("");
    try {
      await login(account.email, account.password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setLocalError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[480px] space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Activity className="size-6" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-semibold tracking-tight">Kiyo</h1>
              <p className="text-xs text-muted-foreground">Pharmaceutical Quality Platform</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="size-5 text-muted-foreground" /> Sign In
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the quality management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@kiyo.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              {(localError || error) && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                  {localError || error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                <LogIn className="size-4" />
                {isLoading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access Demo Accounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Demo Accounts</CardTitle>
            <CardDescription>Click any role to instantly sign in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc)}
                  disabled={isLoading}
                  className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                >
                  <Badge className={`${acc.color} border-transparent text-xs shrink-0`}>
                    {acc.role.split(" ").map(w => w[0]).join("")}
                  </Badge>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{acc.role}</div>
                    <div className="text-xs text-muted-foreground truncate">{acc.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          WHO · FDA · USP · GMP/ISO Compliant
        </p>
      </div>
    </div>
  );
}
