import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AppointmentWithRefs } from "@/hooks/queries";
import { useUpdateAppointment, useCancelAppointment, useProviders } from "@/hooks/queries";
import { Calendar, Clock, Mail, Phone, User, Stethoscope, Video, MapPin, X, History } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const statusOptions = ["confirmed", "checked-in", "in-progress", "completed", "cancelled", "no-show"];

export function AppointmentDetailDrawer({
  appt,
  open,
  onOpenChange,
}: {
  appt: AppointmentWithRefs | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const update = useUpdateAppointment();
  const cancel = useCancelAppointment();
  const { data: providers } = useProviders();
  const [editing, setEditing] = useState(false);
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(30);
  const [providerId, setProviderId] = useState("");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<{ created_at: string; action: string; metadata: Record<string, unknown> }[]>([]);

  useEffect(() => {
    if (!appt) return;
    const d = new Date(appt.scheduled_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setWhen(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    setDuration(appt.duration_min);
    setProviderId(appt.provider_id ?? "");
    setNotes(appt.notes ?? "");
    setEditing(false);
  }, [appt]);

  useEffect(() => {
    if (!appt || !open) return;
    (async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("created_at, action, metadata")
        .eq("entity", "appointment")
        .eq("entity_id", appt.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setHistory((data ?? []) as typeof history);
    })();
  }, [appt, open]);

  if (!appt) return null;

  const save = async () => {
    await update.mutateAsync({
      id: appt.id,
      scheduled_at: new Date(when).toISOString(),
      duration_min: duration,
      provider_id: providerId || null,
      notes,
    });
    setEditing(false);
  };

  const startTime = new Date(appt.scheduled_at);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold">
                Appointment
              </div>
              <span className={`pill ${statusPill(appt.status)}`}>{appt.status}</span>
            </div>
            <SheetTitle className="text-lg mt-1.5">{appt.reason ?? "Visit"}</SheetTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="inline-flex items-center gap-1.5"><Calendar className="size-3.5" />{startTime.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{startTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {appt.duration_min} min</span>
              <span className="inline-flex items-center gap-1.5">{appt.visit_type === "telehealth" ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}{appt.visit_type}</span>
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <div className="label-eyebrow mb-2">Patient</div>
            {appt.patient ? (
              <Link to="/patients/$patientId" params={{ patientId: appt.patient.id }} className="block surface p-4 hover:bg-primary/[0.04] transition">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"><User className="size-4" /></div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{appt.patient.name}</div>
                    <div className="text-xs text-muted-foreground truncate">MRN {appt.patient.mrn}</div>
                  </div>
                </div>
                {(appt.patient.phone || appt.patient.email) && (
                  <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                    {appt.patient.phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{appt.patient.phone}</span>}
                    {appt.patient.email && <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{appt.patient.email}</span>}
                  </div>
                )}
              </Link>
            ) : (
              <div className="text-sm text-muted-foreground">Unassigned</div>
            )}
          </section>

          <section>
            <div className="label-eyebrow mb-2">Provider</div>
            <div className="surface p-4 flex items-center gap-3">
              <div className="size-9 rounded-full bg-accent/40 text-foreground/70 flex items-center justify-center"><Stethoscope className="size-4" /></div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{appt.provider?.name ?? "Unassigned"}</div>
                {appt.provider?.specialty && <div className="text-xs text-muted-foreground truncate">{appt.provider.specialty}</div>}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="label-eyebrow">Details</div>
              {!editing && <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldLabel label="When"><input type="datetime-local" className={field} value={when} onChange={(e) => setWhen(e.target.value)} /></FieldLabel>
                  <FieldLabel label="Duration"><input type="number" min={5} step={5} className={field} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></FieldLabel>
                </div>
                <FieldLabel label="Provider">
                  <select className={field} value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                    <option value="">Unassigned</option>
                    {providers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FieldLabel>
                <FieldLabel label="Notes">
                  <textarea rows={3} className={`${field} h-auto py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Visit notes, prep, follow-up tasks…" />
                </FieldLabel>
                <div className="flex justify-end gap-2 pt-1">
                  <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn btn-primary" disabled={update.isPending} onClick={save}>Save changes</button>
                </div>
              </div>
            ) : (
              <div className="surface p-4 text-sm text-foreground/85 whitespace-pre-wrap min-h-[60px]">
                {appt.notes || <span className="text-muted-foreground">No notes yet.</span>}
              </div>
            )}
          </section>

          <section>
            <div className="label-eyebrow mb-2">Status</div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => update.mutate({ id: appt.id, status: s })}
                  className={`pill ${statusPill(s)} ${appt.status === s ? "ring-2 ring-ring/40" : "opacity-70 hover:opacity-100"} transition`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="label-eyebrow mb-2 flex items-center gap-2"><History className="size-3.5" /> Status history</div>
            {history.length === 0 ? (
              <div className="text-xs text-muted-foreground">No activity recorded yet.</div>
            ) : (
              <ol className="space-y-2">
                {history.map((h, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs">
                    <div className="mt-1 size-1.5 rounded-full bg-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground/85 capitalize">{h.action.replace(/[._]/g, " ")}{h.metadata?.status ? ` → ${String(h.metadata.status)}` : ""}</div>
                      <div className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <button
              className="btn btn-ghost text-destructive hover:bg-destructive/10"
              disabled={appt.status === "cancelled" || cancel.isPending}
              onClick={() => cancel.mutate({ id: appt.id }, { onSuccess: () => onOpenChange(false) })}
            >
              <X className="size-4" /> Cancel appointment
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/80">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function statusPill(status: string): string {
  switch (status) {
    case "confirmed": return "pill--info";
    case "checked-in":
    case "in-progress": return "pill--warning";
    case "completed": return "pill--success";
    case "cancelled": return "pill--neutral";
    case "no-show": return "pill--danger";
    default: return "pill--neutral";
  }
}

export function statusDot(status: string): string {
  switch (status) {
    case "confirmed": return "bg-sky-500";
    case "checked-in": return "bg-amber-500";
    case "in-progress": return "bg-orange-500";
    case "completed": return "bg-emerald-500";
    case "cancelled": return "bg-muted-foreground/50";
    case "no-show": return "bg-rose-500";
    default: return "bg-muted-foreground/50";
  }
}

export function statusEventClasses(status: string): string {
  // background tint + left border accent for calendar events
  switch (status) {
    case "confirmed": return "bg-sky-500/10 border-l-sky-500 text-sky-700 dark:text-sky-300";
    case "checked-in": return "bg-amber-500/10 border-l-amber-500 text-amber-700 dark:text-amber-300";
    case "in-progress": return "bg-orange-500/10 border-l-orange-500 text-orange-700 dark:text-orange-300";
    case "completed": return "bg-emerald-500/10 border-l-emerald-500 text-emerald-700 dark:text-emerald-300";
    case "cancelled": return "bg-muted/60 border-l-muted-foreground/40 text-muted-foreground line-through";
    case "no-show": return "bg-rose-500/10 border-l-rose-500 text-rose-700 dark:text-rose-300";
    default: return "bg-muted/60 border-l-muted-foreground/40 text-muted-foreground";
  }
}