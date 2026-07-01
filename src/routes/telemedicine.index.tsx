import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Video, Lock, ShieldCheck, Clock, ArrowUpRight, CalendarPlus, Users, Signal, Stethoscope,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { NewAppointmentDialog } from "@/components/dialogs/NewAppointmentDialog";
import { useTelemedicineSessions, useAppointmentsRealtime, type AppointmentWithRefs } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/telemedicine/")({ component: TelemedicineLobby });

function sessionState(a: AppointmentWithRefs): { key: "live" | "joinable" | "upcoming" | "past"; label: string; tone: string } {
  if (a.status === "cancelled") return { key: "past", label: "Cancelled", tone: "pill--neutral" };
  if (a.status === "completed") return { key: "past", label: "Completed", tone: "pill--neutral" };
  const t = new Date(a.scheduled_at).getTime();
  const end = t + (a.duration_min ?? 30) * 60_000;
  const now = Date.now();
  if (now >= t && now <= end) return { key: "live", label: "In progress", tone: "pill--success" };
  if (now < t && t - now <= 15 * 60_000) return { key: "joinable", label: "Joinable", tone: "pill--info" };
  if (now < t) return { key: "upcoming", label: "Upcoming", tone: "pill--neutral" };
  return { key: "past", label: "Ended", tone: "pill--neutral" };
}

function TelemedicineLobby() {
  useAppointmentsRealtime();
  const { data, isLoading } = useTelemedicineSessions();

  const groups = useMemo(() => {
    const all = data ?? [];
    const today: AppointmentWithRefs[] = [];
    const upcoming: AppointmentWithRefs[] = [];
    const past: AppointmentWithRefs[] = [];
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);
    for (const a of all) {
      const t = new Date(a.scheduled_at);
      if (a.status === "completed" || a.status === "cancelled" || t.getTime() + (a.duration_min ?? 30) * 60_000 < Date.now() - 60_000) past.push(a);
      else if (t >= startOfDay && t < endOfDay) today.push(a);
      else if (t >= endOfDay) upcoming.push(a);
      else today.push(a);
    }
    return { today, upcoming, past: past.slice(0, 12) };
  }, [data]);

  const stats = useMemo(() => {
    const all = data ?? [];
    const live = all.filter((a) => sessionState(a).key === "live").length;
    const joinable = all.filter((a) => sessionState(a).key === "joinable").length;
    const completed = all.filter((a) => a.status === "completed").length;
    return { live, joinable, completed, total: all.length };
  }, [data]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        eyebrow="Virtual care"
        title="Telemedicine"
        description="Secure, HIPAA-compliant video consultations with the full patient chart on hand."
        actions={
          <NewAppointmentDialog
            trigger={
              <button className="btn btn-primary">
                <CalendarPlus className="size-4" /> Schedule session
              </button>
            }
          />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Live now" value={stats.live} icon={Signal} accent="text-success" />
        <KpiCard label="Joinable" value={stats.joinable} icon={Video} accent="text-primary" />
        <KpiCard label="Total scheduled" value={stats.total} icon={Users} />
        <KpiCard label="Completed" value={stats.completed} icon={Stethoscope} />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No telemedicine sessions yet"
          description="Schedule a virtual visit to start consulting patients remotely."
          icon={Video}
        />
      ) : (
        <div className="space-y-8">
          <SessionSection title="Today" subtitle={`${groups.today.length} session${groups.today.length === 1 ? "" : "s"}`} sessions={groups.today} emptyLabel="No telemedicine sessions today." />
          <SessionSection title="Upcoming" subtitle={`${groups.upcoming.length} scheduled`} sessions={groups.upcoming} emptyLabel="No upcoming sessions." />
          {groups.past.length > 0 && (
            <SessionSection title="Recent" subtitle="Past sessions" sessions={groups.past} emptyLabel="" muted />
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent?: string }) {
  return (
    <div className="surface p-5 lift-on-hover">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{label}</div>
        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className={cn("size-4", accent)} />
        </div>
      </div>
      <div className="mt-3 text-[1.625rem] font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function SessionSection({ title, subtitle, sessions, emptyLabel, muted }: { title: string; subtitle: string; sessions: AppointmentWithRefs[]; emptyLabel: string; muted?: boolean }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      {sessions.length === 0 ? (
        <div className="surface px-5 py-8 text-center text-sm text-muted-foreground">{emptyLabel}</div>
      ) : (
        <div className={cn("grid md:grid-cols-2 gap-4", muted && "opacity-90")}>
          {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
        </div>
      )}
    </section>
  );
}

function SessionCard({ session }: { session: AppointmentWithRefs }) {
  const state = sessionState(session);
  const time = new Date(session.scheduled_at);
  const canJoin = state.key === "live" || state.key === "joinable";
  return (
    <Link
      to="/telemedicine/$appointmentId"
      params={{ appointmentId: session.id }}
      className="surface p-5 lift-on-hover group flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-semibold shrink-0">
            {(session.patient?.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight truncate">{session.patient?.name ?? "Unassigned patient"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {session.patient?.mrn ?? "—"} · {session.reason ?? "Virtual visit"}
            </div>
          </div>
        </div>
        <span className={cn("pill", state.tone)}>{state.label}</span>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {time.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
          <span className="inline-flex items-center gap-1"><Lock className="size-3" /> E2EE</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3 text-success" /> HIPAA</span>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium",
          canJoin
            ? "text-primary-foreground"
            : "text-muted-foreground bg-secondary",
        )} style={canJoin ? { background: "var(--gradient-primary)" } : undefined}>
          <Video className="size-3.5" /> {canJoin ? "Join" : "Open"} <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}