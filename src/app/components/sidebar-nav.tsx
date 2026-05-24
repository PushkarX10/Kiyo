import { LayoutDashboard, Package, FlaskConical, ShieldCheck, Truck, Settings, ChevronLeft, Activity, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

export type ScreenKey = "dashboard" | "batches" | "testing" | "compliance" | "supply" | "analytics" | "settings";

const items: { key: ScreenKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "batches", label: "Batches", icon: Package },
  { key: "testing", label: "Quality Testing", icon: FlaskConical },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "supply", label: "Supply Chain", icon: Truck },
  { key: "analytics", label: "Analytics", icon: Sparkles },
  { key: "settings", label: "Settings", icon: Settings },
];

interface Props {
  active: ScreenKey;
  onChange: (k: ScreenKey) => void;
  collapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function SidebarNav({ active, onChange, collapsed, onToggle, isMobileOpen, onCloseMobile }: Props) {
  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          "fixed inset-y-0 left-0 z-50 md:relative",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
      <div className={cn("flex items-center gap-2 px-4 h-16 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
        <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center shrink-0">
          <Activity className="size-4" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sidebar-foreground font-semibold tracking-tight">Kiyo</div>
            <div className="text-xs text-sidebar-foreground/60">Quality Platform</div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? it.label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{it.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
    </>
  );
}
