import { Link, Outlet, useRouterState } from "@tanstack/react-router";
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
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/prescriptions", label: "Prescriptions", icon: FileText },
  { to: "/symptom-checker", label: "AI Symptom Check", icon: Sparkles },
  { to: "/claims", label: "Insurance Claims", icon: Receipt },
  { to: "/analytics", label: "Revenue", icon: Activity },
  { to: "/telemedicine", label: "Telemedicine", icon: Video },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
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
          <nav className="flex-1 p-3 space-y-0.5">
            {nav.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/60 cursor-pointer">
              <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
                DR
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">Dr. Reyes</div>
                <div className="text-[11px] text-muted-foreground truncate">Internal Medicine</div>
              </div>
              <Settings className="size-4 text-muted-foreground" />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
            <div className="flex items-center gap-3 px-6 py-3">
              <div className="relative flex-1 max-w-md">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search patients, claims, records…"
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <button className="size-9 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground relative">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-success/10 text-success text-xs font-medium">
                <ShieldCheck className="size-3.5" /> HIPAA secure session
              </div>
            </div>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}