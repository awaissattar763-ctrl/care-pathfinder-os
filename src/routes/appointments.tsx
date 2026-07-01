import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, ListChecks } from "lucide-react";
import {
  useAppointments,
  useProviders,
  useUpdateAppointment,
  useAppointmentsRealtime,
  useRooms,
  findConflict,
  type AppointmentWithRefs,
} from "@/hooks/queries";
import { NewAppointmentDialog } from "@/components/dialogs/NewAppointmentDialog";
import { WaitlistDrawer } from "@/components/appointments/WaitlistDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useMemo, useState, type DragEvent } from "react";
import { toast } from "sonner";
import {
  AppointmentDetailDrawer,
  statusDot,
  statusEventClasses,
} from "@/components/appointments/AppointmentDetailDrawer";

export const Route = createFileRoute("/appointments")({ component: AppointmentsPage });

type ViewMode = "month" | "week" | "day";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

function AppointmentsPage() {
  const { data, isLoading } = useAppointments();
  const { data: providers } = useProviders();
  const { data: rooms } = useRooms();
  const update = useUpdateAppointment();
  useAppointmentsRealtime();

  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()));
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AppointmentWithRefs | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickDate, setQuickDate] = useState<Date | undefined>();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [showRoomLanes, setShowRoomLanes] = useState(false);

  const appts = useMemo(() => {
    return (data ?? []).filter((a) => providerFilter === "all" || a.provider_id === providerFilter);
  }, [data, providerFilter]);

  const goPrev = () => setCursor((c) => view === "month" ? new Date(c.getFullYear(), c.getMonth() - 1, 1) : addDays(c, view === "week" ? -7 : -1));
  const goNext = () => setCursor((c) => view === "month" ? new Date(c.getFullYear(), c.getMonth() + 1, 1) : addDays(c, view === "week" ? 7 : 1));
  const goToday = () => setCursor(startOfDay(new Date()));

  const headerLabel = useMemo(() => {
    if (view === "month") return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    if (view === "week") {
      const s = startOfWeek(cursor);
      const e = addDays(s, 6);
      return `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${e.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, [view, cursor]);

  const openQuickCreate = (d?: Date) => { setQuickDate(d); setQuickOpen(true); };

  const onDropTo = async (
    appt: AppointmentWithRefs,
    target: Date,
    opts?: { keepTime?: boolean; roomId?: string | null },
  ) => {
    const orig = new Date(appt.scheduled_at);
    const next = new Date(target);
    if (opts?.keepTime) {
      next.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
    }
    const roomChanged = opts?.roomId !== undefined && opts.roomId !== appt.room_id;
    if (next.getTime() === orig.getTime() && !roomChanged) return;
    const conflict = findConflict(data ?? [], {
      id: appt.id,
      scheduled_at: next.toISOString(),
      duration_min: appt.duration_min,
      provider_id: appt.provider_id,
      room_id: opts?.roomId !== undefined ? opts.roomId : appt.room_id,
    });
    if (conflict) {
      toast.error(
        `Conflict: ${conflict.patient?.name ?? "another visit"} at ${new Date(conflict.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
      );
      return;
    }
    await update.mutateAsync({
      id: appt.id,
      scheduled_at: next.toISOString(),
      ...(roomChanged ? { room_id: opts?.roomId ?? null } : {}),
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Appointment Center"
        title={headerLabel}
        description="Coordinate the schedule across providers and visit types."
        actions={
          <>
            <select
              aria-label="Provider filter"
              className="h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">All providers</option>
              {providers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={() => setWaitlistOpen(true)}>
              <ListChecks className="size-4" /> Waitlist
            </button>
            <NewAppointmentDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> Book</button>} />
          </>
        }
      />

      <div className="surface mb-4 px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-sm" onClick={goPrev} aria-label="Previous"><ChevronLeft className="size-4" /></button>
          <button className="btn btn-secondary btn-sm" onClick={goToday}>Today</button>
          <button className="btn btn-ghost btn-sm" onClick={goNext} aria-label="Next"><ChevronRight className="size-4" /></button>
        </div>
        <div className="inline-flex rounded-lg bg-secondary p-0.5" role="tablist" aria-label="View">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`px-3 h-7 text-xs font-medium rounded-md capitalize transition ${view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {view === "day" && rooms && rooms.length > 0 && (
            <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" className="accent-primary" checked={showRoomLanes} onChange={(e) => setShowRoomLanes(e.target.checked)} />
              Room lanes
            </label>
          )}
          <Legend />
        </div>
      </div>

      <div className="surface overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing on the books"
            description="Schedule your first appointment to see the clinic flow."
            action={<NewAppointmentDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> Book appointment</button>} />}
          />
        ) : view === "month" ? (
          <MonthView cursor={cursor} appts={appts} onSelect={setSelected} onDropTo={onDropTo} onQuickCreate={openQuickCreate} />
        ) : view === "week" ? (
          <WeekView cursor={cursor} appts={appts} onSelect={setSelected} onDropTo={onDropTo} onQuickCreate={openQuickCreate} />
        ) : showRoomLanes && rooms && rooms.length > 0 ? (
          <DayRoomLanes cursor={cursor} appts={appts} rooms={rooms} onSelect={setSelected} onDropTo={onDropTo} onQuickCreate={openQuickCreate} />
        ) : (
          <DayView cursor={cursor} appts={appts} onSelect={setSelected} onDropTo={onDropTo} onQuickCreate={openQuickCreate} />
        )}
      </div>

      <AppointmentDetailDrawer appt={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
      <NewAppointmentDialog open={quickOpen} onOpenChange={setQuickOpen} initialDate={quickDate} />
      <WaitlistDrawer
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        onOffer={() => {
          setWaitlistOpen(false);
          setQuickDate(new Date());
          setQuickOpen(true);
        }}
      />
    </div>
  );
}

function Legend() {
  const items: { s: string; label: string }[] = [
    { s: "confirmed", label: "Confirmed" },
    { s: "checked-in", label: "Checked-in" },
    { s: "in-progress", label: "In progress" },
    { s: "completed", label: "Completed" },
    { s: "no-show", label: "No-show" },
  ];
  return (
    <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground">
      {items.map((i) => (
        <span key={i.s} className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${statusDot(i.s)}`} />{i.label}
        </span>
      ))}
    </div>
  );
}

/* ---------------- Month ---------------- */

function MonthView({ cursor, appts, onSelect, onDropTo, onQuickCreate }: ViewProps) {
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();

  return (
    <div className="grid grid-cols-7 border-t border-border" role="grid">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2 px-2 border-b border-border bg-secondary/30">{d}</div>
      ))}
      {days.map((d, i) => {
        const inMonth = d.getMonth() === cursor.getMonth();
        const dayAppts = appts.filter((a) => sameDay(new Date(a.scheduled_at), d));
        return (
          <DropCell
            key={i}
            onDrop={(appt) => onDropTo(appt, d, { keepTime: true })}
            className={`min-h-[110px] border-b border-r border-border p-1.5 flex flex-col gap-1 transition ${inMonth ? "bg-background" : "bg-secondary/20"} ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => onQuickCreate(setHour(d, 9))}
                className={`text-xs tabular-nums size-6 rounded-full inline-flex items-center justify-center transition ${sameDay(d, today) ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary"}`}
                aria-label={`Add appointment ${d.toDateString()}`}
              >
                {d.getDate()}
              </button>
            </div>
            <div className="flex flex-col gap-0.5 overflow-hidden">
              {dayAppts.slice(0, 3).map((a) => (
                <EventChip key={a.id} appt={a} compact onClick={() => onSelect(a)} />
              ))}
              {dayAppts.length > 3 && (
                <div className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} more</div>
              )}
            </div>
          </DropCell>
        );
      })}
    </div>
  );
}

/* ---------------- Week ---------------- */

const HOURS = Array.from({ length: 12 }, (_, i) => 7 + i); // 7am – 6pm

function WeekView({ cursor, appts, onSelect, onDropTo, onQuickCreate }: ViewProps) {
  const weekStart = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px]" style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}>
        <div className="border-b border-border" />
        {days.map((d) => (
          <div key={d.toISOString()} className={`border-b border-l border-border px-2 py-2 text-center ${sameDay(d, today) ? "bg-primary/[0.06]" : ""}`}>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
            <div className={`text-sm font-semibold tabular-nums ${sameDay(d, today) ? "text-primary" : ""}`}>{d.getDate()}</div>
          </div>
        ))}

        {HOURS.map((h) => (
          <Row key={h} hour={h} days={days} appts={appts} onSelect={onSelect} onDropTo={onDropTo} onQuickCreate={onQuickCreate} />
        ))}
      </div>
    </div>
  );
}

function Row({ hour, days, appts, onSelect, onDropTo, onQuickCreate }: { hour: number; days: Date[] } & Pick<ViewProps, "appts" | "onSelect" | "onDropTo" | "onQuickCreate">) {
  return (
    <>
      <div className="border-b border-border text-[11px] text-muted-foreground text-right pr-2 pt-1 tabular-nums">{formatHour(hour)}</div>
      {days.map((d) => {
        const cellDate = setHour(d, hour);
        const cellAppts = appts.filter((a) => {
          const t = new Date(a.scheduled_at);
          return sameDay(t, d) && t.getHours() === hour;
        });
        return (
          <DropCell
            key={d.toISOString() + hour}
            onDrop={(appt) => onDropTo(appt, cellDate)}
            className="relative min-h-[56px] border-b border-l border-border group hover:bg-primary/[0.03] transition"
          >
            <button
              onClick={() => onQuickCreate(cellDate)}
              className="absolute inset-0 opacity-0 group-hover:opacity-100 text-[11px] text-muted-foreground transition flex items-start justify-end p-1"
              aria-label={`Create at ${cellDate.toLocaleString()}`}
            >
              <Plus className="size-3" />
            </button>
            <div className="relative p-1 flex flex-col gap-1">
              {cellAppts.map((a) => <EventChip key={a.id} appt={a} onClick={() => onSelect(a)} />)}
            </div>
          </DropCell>
        );
      })}
    </>
  );
}

/* ---------------- Day ---------------- */

function DayView({ cursor, appts, onSelect, onDropTo, onQuickCreate }: ViewProps) {
  const day = cursor;
  const dayAppts = appts.filter((a) => sameDay(new Date(a.scheduled_at), day));

  return (
    <div className="grid" style={{ gridTemplateColumns: "64px 1fr" }}>
      {HOURS.map((h) => {
        const cellDate = setHour(day, h);
        const hourAppts = dayAppts.filter((a) => new Date(a.scheduled_at).getHours() === h);
        return (
          <div key={h} className="contents">
            <div className="border-b border-border text-xs text-muted-foreground text-right pr-3 pt-2 tabular-nums">{formatHour(h)}</div>
            <DropCell
              onDrop={(appt) => onDropTo(appt, cellDate)}
              className="border-b border-l border-border min-h-[72px] p-2 group hover:bg-primary/[0.03] transition relative"
            >
              <button
                onClick={() => onQuickCreate(cellDate)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground"
                aria-label="Quick create"
              ><Plus className="size-3.5" /></button>
              <div className="flex flex-col gap-1.5">
                {hourAppts.map((a) => <EventChip key={a.id} appt={a} expanded onClick={() => onSelect(a)} />)}
              </div>
            </DropCell>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Shared bits ---------------- */

type ViewProps = {
  cursor: Date;
  appts: AppointmentWithRefs[];
  onSelect: (a: AppointmentWithRefs) => void;
  onDropTo: (appt: AppointmentWithRefs, target: Date, opts?: { keepTime?: boolean; roomId?: string | null }) => void;
  onQuickCreate: (d?: Date) => void;
};

function EventChip({ appt, compact, expanded, onClick }: { appt: AppointmentWithRefs; compact?: boolean; expanded?: boolean; onClick: () => void }) {
  const time = new Date(appt.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/appt-id", appt.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className={`group/event text-left w-full truncate rounded-md border-l-2 px-2 py-1 transition hover:translate-y-[-1px] hover:shadow-sm cursor-grab active:cursor-grabbing ${statusEventClasses(appt.status)}`}
      title={`${appt.patient?.name ?? "Unassigned"} · ${time}`}
    >
      <div className={`flex items-center gap-1.5 ${compact ? "text-[11px]" : "text-xs"} font-medium`}>
        <span className="tabular-nums opacity-80">{time}</span>
        <span className="truncate">{appt.patient?.name ?? "Unassigned"}</span>
      </div>
      {expanded && (
        <div className="text-[11px] opacity-80 truncate mt-0.5">{appt.reason ?? "Visit"} · {appt.visit_type} · {appt.duration_min}m</div>
      )}
    </button>
  );
}

function DropCell({ children, className, onDrop }: { children: React.ReactNode; className?: string; onDrop: (appt: AppointmentWithRefs) => void }) {
  const { data: appts } = useAppointments();
  const [over, setOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const id = e.dataTransfer.getData("text/appt-id");
    const appt = (appts ?? []).find((a) => a.id === id);
    if (appt) onDrop(appt);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={`${className ?? ""} ${over ? "ring-2 ring-inset ring-primary/40 bg-primary/[0.05]" : ""}`}
    >
      {children}
    </div>
  );
}

function setHour(d: Date, h: number) { const x = startOfDay(d); x.setHours(h, 0, 0, 0); return x; }
function formatHour(h: number) {
  const am = h < 12; const hr = h % 12 || 12;
  return `${hr} ${am ? "AM" : "PM"}`;
}

/* ---------------- Day · Room lanes ---------------- */

function DayRoomLanes({
  cursor,
  appts,
  rooms,
  onSelect,
  onDropTo,
  onQuickCreate,
}: ViewProps & { rooms: { id: string; name: string }[] }) {
  const day = cursor;
  const lanes = [{ id: "__none", name: "No room" }, ...rooms];
  const dayAppts = appts.filter((a) => sameDay(new Date(a.scheduled_at), day));

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[760px]"
        style={{ gridTemplateColumns: `64px repeat(${lanes.length}, minmax(0, 1fr))` }}
      >
        <div className="border-b border-border" />
        {lanes.map((r) => (
          <div key={r.id} className="border-b border-l border-border px-2 py-2 text-center">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Room</div>
            <div className="text-sm font-semibold truncate">{r.name}</div>
          </div>
        ))}
        {HOURS.map((h) => (
          <RoomRow
            key={h}
            hour={h}
            day={day}
            lanes={lanes}
            appts={dayAppts}
            onSelect={onSelect}
            onDropTo={onDropTo}
            onQuickCreate={onQuickCreate}
          />
        ))}
      </div>
    </div>
  );
}

function RoomRow({
  hour, day, lanes, appts, onSelect, onDropTo, onQuickCreate,
}: {
  hour: number; day: Date; lanes: { id: string; name: string }[];
} & Pick<ViewProps, "appts" | "onSelect" | "onDropTo" | "onQuickCreate">) {
  return (
    <>
      <div className="border-b border-border text-[11px] text-muted-foreground text-right pr-2 pt-1 tabular-nums">{formatHour(hour)}</div>
      {lanes.map((lane) => {
        const cellDate = setHour(day, hour);
        const cell = appts.filter((a) => {
          const t = new Date(a.scheduled_at);
          if (t.getHours() !== hour) return false;
          return lane.id === "__none" ? !a.room_id : a.room_id === lane.id;
        });
        return (
          <DropCell
            key={lane.id + hour}
            onDrop={(appt) => onDropTo(appt, cellDate, { roomId: lane.id === "__none" ? null : lane.id })}
            className="relative min-h-[56px] border-b border-l border-border group hover:bg-primary/[0.03] transition"
          >
            <button
              onClick={() => onQuickCreate(cellDate)}
              className="absolute inset-0 opacity-0 group-hover:opacity-100 text-[11px] text-muted-foreground transition flex items-start justify-end p-1"
              aria-label={`Create at ${cellDate.toLocaleString()}`}
            >
              <Plus className="size-3" />
            </button>
            <div className="relative p-1 flex flex-col gap-1">
              {cell.map((a) => <EventChip key={a.id} appt={a} onClick={() => onSelect(a)} />)}
            </div>
          </DropCell>
        );
      })}
    </>
  );
}
