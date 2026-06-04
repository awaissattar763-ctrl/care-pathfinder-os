import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  Users,
  CalendarDays,
  Activity,
  ArrowUpRight,
  Clock,
  FileText,
  Lock,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { AIInsightCard } from "@/components/copilot/AIInsightCard";
import { useDashboardMetrics, useAppointments, useAuditLogs } from "@/hooks/queries";
import { NewAppointmentDialog } from "@/components/dialogs/NewAppointmentDialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: m, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: appts } = useAppointments();
  const { data: audit } = useAuditLogs(5);

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);
  const today = (appts ?? []).filter((a) => {
    const t = new Date(a.scheduled_at);
    return t >= startOfDay && t < endOfDay;
  }).slice(0, 6);

  const nextTime = m?.nextAppointmentAt
    ? new Date(m.nextAppointmentAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "—";

  const stats = [
    { label: "Patients in registry", value: m?.patientsTotal ?? 0, delta: "Total", icon: Users },
    { label: "Appointments today", value: m?.appointmentsToday ?? 0, delta: `Next at ${nextTime}`, icon: CalendarDays },
    { label: "Utilization (7d)", value: m ? `${m.utilization7d}%` : "—", delta: "Completed vs scheduled", icon: Gauge },
    { label: "Missed (30d)", value: m?.missed30d ?? 0, delta: "No-show appointments", icon: AlertTriangle },
    { label: "Revenue MTD", value: m ? `$${m.revenueMTD.toLocaleString()}` : "—", delta: "Approved claims", icon: Activity },
    { label: "Open claims", value: m?.openClaims ?? 0, delta: "Submitted or in review", icon: FileText },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        title="Good morning"
        description="Here's what's happening across your practice today."
        actions={
          <>
            <button className="btn btn-secondary">Print huddle</button>
            <NewAppointmentDialog trigger={<button className="btn btn-primary">New appointment <ArrowUpRight className="size-4" /></button>} />
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="surface p-5 lift-on-hover animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between">
                <div className="label-eyebrow">{s.label}</div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center" aria-hidden>
                  <Icon className="size-4" aria-hidden />
                </div>
              </div>
              <div className="mt-3 text-[1.625rem] font-semibold tracking-tight tabular-nums">
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : s.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{s.delta}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 surface">
          <div className="section-head">
            <div>
              <div className="section-head__title">Today's schedule</div>
              <div className="section-head__sub">{today.length} appointments</div>
            </div>
            <Link to="/appointments" className="btn btn-ghost btn-sm">View calendar</Link>
          </div>
          {today.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">No appointments scheduled for today.</div>
          ) : (
            <ul className="divide-y divide-border">
              {today.map((a, i) => (
                <li key={a.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-primary/[0.04] transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-20 shrink-0 text-sm font-medium tabular-nums">
                    {new Date(a.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.patient?.name ?? "Unassigned"}</div>
                    <div className="text-xs text-muted-foreground truncate" title={a.reason ?? undefined}>{a.reason ?? "—"}</div>
                  </div>
                  <UrgencyBadge level="routine" />
                  <span className={a.visit_type === "telehealth" ? "pill pill--info" : "pill pill--neutral"}>
                    {a.status}
                  </span>
                  <Lock className="size-3 text-muted-foreground/60" aria-label="PHI encrypted" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <AIInsightCard
            title="Copilot ready to assist"
            summary="Use the Copilot to summarize charts, draft prescriptions, and triage today's inbox."
            suggestions={[
              { label: "Summarize today's huddle", prompt: "Summarize today's appointments and flag the highest-priority patient encounters." },
              { label: "Triage today's inbox", prompt: "Help me triage today's appointment requests by urgency and recommend in-person vs telemedicine." },
            ]}
          />

          <div className="surface">
            <div className="section-head">
              <div>
                <div className="section-head__title">Telemedicine</div>
                <div className="section-head__sub">{upcomingTele.length} upcoming</div>
              </div>
              <Link to="/telemedicine" className="btn btn-ghost btn-sm">Open lobby</Link>
            </div>
            {upcomingTele.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No upcoming virtual visits.</div>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingTele.map((s) => {
                  const t = new Date(s.scheduled_at).getTime();
                  const joinable = Date.now() >= t - 15 * 60_000 && Date.now() <= t + (s.duration_min ?? 30) * 60_000;
                  return (
                    <li key={s.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Video className="size-4" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.patient?.name ?? "Unassigned"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(s.scheduled_at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })} · {s.reason ?? "Virtual visit"}
                        </div>
                      </div>
                      <Link to="/telemedicine/$appointmentId" params={{ appointmentId: s.id }}
                        className={joinable ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}>
                        {joinable ? "Join" : "Open"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="surface">
            <div className="section-head">
              <div>
                <div className="section-head__title">Recent activity</div>
                <div className="section-head__sub">Audit trail</div>
              </div>
            </div>
            {!audit || audit.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No recent activity.</div>
            ) : (
              <ul className="p-3 space-y-1">
                {audit.map((a, i) => (
                  <li key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-primary/[0.04] transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden>
                      <Activity className="size-4" aria-hidden />
                    </div>
                    <div className="text-sm text-foreground/85 leading-snug capitalize">
                      {a.action.replace(/[._]/g, " ")} <span className="text-muted-foreground">· {a.entity}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><Clock className="size-3.5" aria-hidden /> Synced just now</span>
              <a href="/compliance" className="text-primary font-medium hover:underline">Audit trail →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
