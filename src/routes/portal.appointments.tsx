import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyAppointments } from "@/hooks/portal-queries";
import { CalendarDays, Video } from "lucide-react";
import { QueryErrorState } from "@/components/QueryErrorState";

export const Route = createFileRoute("/portal/appointments")({ component: PortalAppts });

function PortalAppts() {
  const { data, isLoading, isError, refetch } = useMyAppointments();
  const now = Date.now();
  const upcoming = (data ?? []).filter((a) => new Date(a.scheduled_at).getTime() >= now);
  const past = (data ?? []).filter((a) => new Date(a.scheduled_at).getTime() < now);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><CalendarDays className="size-5 text-primary" /> My visits</h1>
      {isError ? <QueryErrorState compact title="Couldn't load your visits" onRetry={() => refetch()} /> : isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
      <Section title="Upcoming" items={upcoming} empty="No upcoming visits." />
      <Section title="Past" items={past} empty="No past visits." />
    </div>
  );
}

function Section({ title, items, empty }: { title: string; items: Array<{ id: string; scheduled_at: string; visit_type: string; status: string; reason: string | null; duration_min: number; provider: { name: string; specialty: string | null } | null }>; empty: string }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="px-4 py-3 border-b border-border text-sm font-semibold">{title}</header>
      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">{empty}</div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((a) => {
            const t = new Date(a.scheduled_at);
            const isTele = a.visit_type === "telehealth";
            const joinable = isTele && Math.abs(t.getTime() - Date.now()) < 30 * 60_000;
            return (
              <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.reason ?? (isTele ? "Telemedicine visit" : "Visit")}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {a.provider && <> · {a.provider.name}{a.provider.specialty ? ` (${a.provider.specialty})` : ""}</>}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-foreground">{a.status}</span>
                {joinable && (
                  <Link to={`/telemedicine/${a.id}` as never} className="text-[11px] px-2 py-1 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-1">
                    <Video className="size-3" /> Join
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}