import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginScreen } from "./components/login-screen";
import { SidebarNav, type ScreenKey } from "./components/sidebar-nav";
import { TopHeader } from "./components/top-header";
import { DashboardScreen } from "./components/dashboard-screen";
import { BatchesScreen } from "./components/batches-screen";
import { TestingScreen } from "./components/testing-screen";
import { CoAScreen } from "./components/coa-screen";
import { SettingsScreen } from "./components/settings-screen";
import { SupplyScreen } from "./components/supply-screen";
import { AnalyticsScreen } from "./components/analytics-screen";
import { Toaster } from "./components/ui/sonner";

function AppShell() {
  const { isAuthenticated, user, logout } = useAuth();
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className={`h-full w-full flex bg-background text-foreground`}>
      <SidebarNav
        active={screen}
        onChange={(s) => {
          setScreen(s);
          setMobileMenuOpen(false);
        }}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          user={user}
          onLogout={logout}
          onNavigate={(s) => {
            setScreen(s);
            setMobileMenuOpen(false);
          }}
          onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
        />
        <main className="flex-1 overflow-auto">
          {screen === "dashboard" && <DashboardScreen />}
          {screen === "batches" && <BatchesScreen />}
          {screen === "testing" && <TestingScreen />}
          {screen === "compliance" && <CoAScreen />}
          {screen === "supply" && <SupplyScreen />}
          {screen === "analytics" && <AnalyticsScreen />}
          {screen === "settings" && (
            <SettingsScreen dark={dark} onToggleDark={(v) => setDark(v)} />
          )}
        </main>
      </div>
      <Toaster richColors closeButton />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
