import { useState, useEffect } from "react";
import { Search, Bell, Moon, Sun, LogOut, User, Settings as SettingsIcon, Menu } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Props {
  dark: boolean;
  onToggleDark: () => void;
  user?: { name: string; role: string; avatar?: string } | null;
  onLogout?: () => void;
  onNavigate?: (screen: any) => void;
  onToggleMobileMenu?: () => void;
}

export function TopHeader({ dark, onToggleDark, user, onLogout, onNavigate, onToggleMobileMenu }: Props) {
  const [alertCount, setAlertCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.getAlertCount()
      .then((d) => setAlertCount(d.total))
      .catch(() => {}); // ignore if server is not running
  }, []);

  const initials = user?.avatar || user?.name?.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "??";

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      toast.success(`Search: "${searchQuery}"`, { description: "Redirecting to Batches to find matching records." });
      if (onNavigate) onNavigate("batches");
      setSearchQuery("");
    }
  };

  return (
    <header className="h-16 border-b bg-card flex items-center gap-2 md:gap-4 px-4 md:px-6 shrink-0">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileMenu} aria-label="Toggle menu">
        <Menu className="size-5" />
      </Button>

      <div className="relative flex-1 max-w-xl hidden sm:block">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search batches, products, SOPs, alerts… (Press Enter)"
          className="pl-9 bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleDark} aria-label="Toggle theme">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              {alertCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center"
                >
                  {alertCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">Temperature deviation in Lab 1</span>
                <span className="text-xs text-muted-foreground">2 mins ago</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">Batch B-8422 marked as Passed</span>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-center text-sm text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-3 pl-3 ml-1 border-l">
          <div className="text-right leading-tight hidden sm:block">
            <div>{user?.name || "Guest"}</div>
            <div className="text-xs text-muted-foreground">{user?.role || "—"}</div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {user?.avatar && <AvatarImage src={user.avatar} className="object-cover" />}
                  <AvatarFallback className="bg-[#b7cece] text-[#1c0f13]">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "Guest"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.role || "—"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate?.("settings")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate?.("settings")}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onLogout && (
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
