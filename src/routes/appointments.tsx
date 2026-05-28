import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Plus, CalendarDays } from "lucide-react";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/queries";
import { NewAppointmentDialog } from "@/components/dialogs/NewAppointmentDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/appointments")({ component: AppointmentsPage });

const statusOptions = ["confirmed", "checked-in", "in-progress", "completed", "cancelled", "no-show"];

const statusTone: Record<string, string> = {
  confirmed: "pill pill--info",
  "checked-in": "pill pill--warning",
  "in-progress": "pill pill--warning",
  completed: "pill pill--success",
  cancelled: "pill pill--neutral",
  "no-show": "pill pill--danger",
};

function AppointmentsPage() {
  const { data, isLoading } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();

  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, a) => {
    const day = new Date(a.scheduled_at).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    (acc[day] ||= [] as never).push(a);
    return acc;
  }, {} as Record<string, typeof data>);

  return (
    <div>
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        description="Book, reschedule, and run your weekly clinic."
        actions={
          <NewAppointmentDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> Book</button>} />
        }
      />

      <div className="surface">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing on the books"
            description="Schedule your first appointment to see the clinic flow."
            action={<NewAppointmentDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> Book appointment</button>} />}
          />
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day}>
                <div className="px-5 py-3 bg-secondary/40 text-xs font-medium text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur">
                  {day}
                </div>
                <ul className="divide-y divide-border">
                  {(items ?? []).map((a, i) => (
                    <li key={a.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-primary/[0.04] transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 25}ms` }}>
                      <div className="w-20 shrink-0 text-sm font-medium tabular-nums">
                        {new Date(a.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{a.patient?.name ?? "Unassigned"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {a.reason ?? "—"} · {a.visit_type} · {a.duration_min} min
                        </div>
                      </div>
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus.mutate({ id: a.id, status: e.target.value })}
                        className={`${statusTone[a.status] ?? "pill pill--neutral"} cursor-pointer border-0 outline-none`}
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
