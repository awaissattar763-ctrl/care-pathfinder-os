import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyPatient, useMyAppointments, useMyLabResults, useMyPrescriptions } from "@/hooks/portal-queries";
import { CalendarDays, FlaskConical, FileText, Video, MessageSquare, ShieldCheck, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/QueryErrorState";

export const Route = createFileRoute("/portal/")({
  component: PortalHome,
});

function PortalHome() {
  const { data: patient, isLoading, isError, refetch } = useMyPatient();
  const { data: appts } = useMyAppointments();
  const { data: labs } = useMyLabResults();
  const { data: rx } = useMyPrescriptions();

  const upcoming = (appts ?? []).filter((a) => new Date(a.scheduled_at) >= new Date()).slice(0, 3);
  const newLabs = (labs ?? []).slice(0, 3);
  const activeRx = (rx ?? []).filter((r) => r.status !== "Cancelled").slice(0, 3);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (isError) {
    return <QueryErrorState title="Couldn't load your portal" description="Please try again — if this keeps happening, contact your clinic." onRetry={() => refetch()} />;
  }

  if (!patient) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <AlertTriangle className="size-8 mx-auto text-warning mb-3" />
        <h2 className="font-semibold tracking-tight">Account not linked</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your portal account isn't linked to a patient chart yet. Please contact your clinic to complete enrollment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl p-5 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="text-[11px] uppercase tracking-wider opacity-90">Welcome back</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{patient.name}</h1>
        <div className="mt-1 text-xs opacity-90">MRN {patient.mrn}</div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] bg-white/15 px-2 py-1 rounded-full">
          <ShieldCheck className="size-3.5" /> End-to-end encrypted
        </div>
      </section>

      <QuickCard
        title="Upcoming visits"
        icon={CalendarDays}
        href="/portal/appointments"
        empty="No scheduled appointments."
        items={upcoming.map((a) => ({
          id: a.id,
          title: a.reason ?? a.visit_type,
          meta: new Date(a.scheduled_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
          badge: a.visit_type === "telehealth" ? "Join video" : undefined,
          badgeHref: a.visit_type === "telehealth" ? `/telemedicine/${a.id}` : undefined,
        }))}
      />

      <QuickCard
        title="Recent lab results"
        icon={FlaskConical}
        href="/portal/labs"
        empty="No lab results yet."
        items={newLabs.map((l) => ({
          id: l.id,
          title: l.test_name,
          meta: `${l.value}${l.unit ? " " + l.unit : ""}${l.reference_range ? " · ref " + l.reference_range : ""}`,
          badge: l.flag !== "normal" ? l.flag : undefined,
          tone: l.flag === "critical" || l.flag === "abnormal" ? "warn" : undefined,
        }))}
      />

      <QuickCard
        title="Active prescriptions"
        icon={FileText}
        href="/portal/prescriptions"
        empty="No active prescriptions."
        items={activeRx.map((r) => ({
          id: r.id,
          title: r.drug,
          meta: r.sig,
        }))}
      />

      <Link to="/portal/messages" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <div className="font-medium text-sm">Message your care team</div>
            <div className="text-xs text-muted-foreground">Secure HIPAA-compliant messaging</div>
          </div>
        </div>
        <span className="text-xs text-primary font-medium">Open →</span>
      </Link>

      <p className="text-[11px] text-muted-foreground text-center">
        Information shown is for reference only. For medical emergencies, call 911.
      </p>
    </div>
  );
}

type Item = { id: string; title: string; meta?: string; badge?: string; badgeHref?: string; tone?: "warn" };
function QuickCard({ title, icon: Icon, href, items, empty }: {
  title: string; icon: typeof CalendarDays; href: string; items: Item[]; empty: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <Link to={href as never} className="text-xs text-primary font-medium">View all</Link>
      </header>
      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">{empty}</div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{it.title}</div>
                {it.meta && <div className="text-xs text-muted-foreground truncate">{it.meta}</div>}
              </div>
              {it.badge && (it.badgeHref ? (
                <Link to={it.badgeHref as never} className="text-[11px] px-2 py-1 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-1">
                  <Video className="size-3" /> {it.badge}
                </Link>
              ) : (
                <span className={`text-[11px] px-2 py-1 rounded-full font-medium uppercase ${it.tone === "warn" ? "bg-destructive/15 text-destructive" : "bg-secondary text-foreground"}`}>{it.badge}</span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}