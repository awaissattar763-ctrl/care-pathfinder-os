import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/lib/rbac";
import { LogOut } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Sparkles,
  ShieldCheck,
  Video,
  Receipt,
  Activity,
  Search,
  Bell,
  Lock,
  FlaskConical,
  UserCog,
  CalendarClock,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CopilotProvider, useCopilot } from "@/components/copilot/CopilotContext";
import { AICopilot, CopilotLauncher } from "@/components/copilot/AICopilot";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; perm?: string };
const NAV: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users, perm: "patients.read" },
  { to: "/appointments", label: "Appointments", icon: CalendarDays, perm: "appointments.read" },
  { to: "/prescriptions", label: "Prescriptions", icon: FileText, perm: "prescriptions.read" },
  { to: "/labs", label: "Lab orders", icon: FlaskConical, perm: "labs.read" },
  { to: "/symptom-checker", label: "AI Symptom Check", icon: Sparkles },
  { to: "/claims", label: "Insurance Claims", icon: Receipt, perm: "claims.read" },
  { to: "/billing", label: "Billing", icon: Wallet, perm: "billing.read" },
  { to: "/analytics", label: "Revenue", icon: Activity },
  { to: "/telemedicine", label: "Telemedicine", icon: Video, perm: "telemedicine.provider" },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck, perm: "compliance.read" },
  { to: "/admin/users", label: "Users & Roles", icon: UserCog, perm: "admin.users" },
  { to: "/admin/schedules", label: "Schedules", icon: CalendarClock, perm: "admin.schedules" },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const perms = usePermissions();
  const nav = NAV.filter((n) => !n.perm || perms.has(n.perm as never));

  // Global keyboard shortcuts: "/" focus search, "?" toggle help, Esc closes help
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (!typing && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (!typing && (e.key === "?" || (e.shiftKey && e.key === "/"))) {
        e.preventDefault();
        setShowHelp((v) => !v);
      }
      if (e.key === "Escape") setShowHelp(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CopilotProvider>
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar min-h-screen sticky top-0">
          <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
            <div className="size-9 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
              <Activity className="size-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">HealthOS</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Practice OS · v1.0</div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Primary">
            {nav.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors btn-press",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary transition-opacity",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                    )}
                  />
                  <Icon className={cn("size-4 transition-transform", active && "text-primary")} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <AccountButton />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
            <div className="flex items-center gap-3 px-7 py-3.5">
              <div className="relative flex-1 max-w-md">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  ref={searchRef}
                  aria-label="Search"
                  placeholder="Search patients, claims, records…"
                  className="w-full h-10 pl-9 pr-16 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                />
                <span className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1" aria-hidden>
                  <span className="kbd">/</span>
                </span>
              </div>
              <CopilotHeaderButton />
              <button
                className="size-10 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground relative hover:shadow-sm btn-press"
                aria-label="Notifications (2 unread)"
                title="Notifications"
              >
                <Bell className="size-4" aria-hidden />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary pulse-ring" />
              </button>
              <div
                className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-success/10 text-success text-xs font-medium"
                role="status"
                aria-live="polite"
              >
                <span className="status-dot status-dot--live" aria-hidden /> HIPAA secure session
              </div>
            </div>
          </header>
          <div key={pathname} className="p-7 flex-1 animate-fade-in-up">
            <Outlet />
          </div>
          <footer className="border-t border-border px-7 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="size-3.5 text-success" aria-hidden />
              <span className="font-medium text-foreground">HIPAA compliant</span>
              <span>· AES-256 · BAA on file</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHelp(true)}
                className="hover:text-foreground transition-colors"
                aria-label="Keyboard shortcuts"
              >
                <span className="kbd">?</span> Shortcuts
              </button>
              <span>Last updated 2 min ago</span>
              <span>© 2026 HealthOS</span>
            </div>
          </footer>
        </main>
      </div>
      <CopilotLauncher />
      <AICopilot />

      {showHelp && <ShortcutHelp onClose={() => setShowHelp(false)} />}
    </div>
    </CopilotProvider>
  );
}

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const items: Array<[string, string]> = [
    ["/", "Focus search"],
    ["⌘ K", "Command palette"],
    ["⌘ J", "Open Copilot"],
    ["?", "Show this menu"],
    ["Esc", "Dismiss"],
  ];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4 animate-slide-up-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5"
        style={{ boxShadow: "var(--shadow-hover)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold tracking-tight">Keyboard shortcuts</div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><span className="kbd">Esc</span></button>
        </div>
        <ul className="divide-y divide-border">
          {items.map(([k, label]) => (
            <li key={k} className="flex items-center justify-between py-2 text-sm">
              <span className="text-foreground/85">{label}</span>
              <span className="kbd">{k}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CopilotHeaderButton() {
  const { openCopilot } = useCopilot();










  return (
    <button
      onClick={() => openCopilot()}
      title="Open Copilot (⌘J)"
      aria-label="Open Copilot"
      className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:text-primary text-xs font-medium text-muted-foreground transition"
    >
      <Sparkles className="size-3.5 text-primary" />
      Copilot
      <kbd className="ml-1 px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">⌘J</kbd>
    </button>
  );
}
function AccountButton() {
  const { user, roles, signOut } = useAuth();
  const initials = (user?.email ?? "??").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <button className="flex-1 flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/60 text-left min-w-0" aria-label="Account">
        <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{user?.email ?? "Account"}</div>
          <div className="text-[11px] text-muted-foreground truncate capitalize">{roles[0] ?? "doctor"}</div>
        </div>
      </button>
      <button
        onClick={() => signOut()}
        className="size-9 rounded-lg hover:bg-sidebar-accent/60 flex items-center justify-center text-muted-foreground"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
