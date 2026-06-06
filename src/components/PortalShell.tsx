import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Activity, CalendarDays, FlaskConical, FileText, MessageSquare, User, LogOut, Home, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const nav: NavItem[] = [
  { to: "/portal", label: "Home", icon: Home, exact: true },
  { to: "/portal/appointments", label: "Visits", icon: CalendarDays },
  { to: "/portal/labs", label: "Labs", icon: FlaskConical },
  { to: "/portal/prescriptions", label: "Rx", icon: FileText },
  { to: "/portal/messages", label: "Messages", icon: MessageSquare },
  { to: "/portal/profile", label: "Profile", icon: User },
];

export function PortalShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}>
              <Activity className="size-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight text-sm">HealthOS</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Patient Portal</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-success font-medium">
              <ShieldCheck className="size-3.5" /> HIPAA secure
            </span>
            <button
              onClick={() => signOut()}
              className="size-9 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
              aria-label="Sign out"
              title={user?.email ?? "Sign out"}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <nav className="hidden md:block border-t border-border" aria-label="Patient navigation">
          <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link key={item.to} to={item.to as never}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm border-b-2 transition-colors",
                    active ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" /> {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 pb-24 md:pb-8 animate-fade-in-up">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border safe-area-inset-bottom"
        aria-label="Patient navigation"
      >
        <div className="grid grid-cols-6">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.to} to={item.to as never}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}