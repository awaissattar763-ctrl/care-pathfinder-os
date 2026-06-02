import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCreateAppointment, useCreateAppointmentSeries, usePatients, useProviders, useRooms, useAppointments, findConflict } from "@/hooks/queries";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function NewAppointmentDialog({
  trigger,
  initialDate,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: ReactNode;
  initialDate?: Date;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const { data: patients } = usePatients();
  const { data: providers } = useProviders();
  const { data: rooms } = useRooms();
  const { data: appts } = useAppointments();
  const [patientId, setPatientId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [visitType, setVisitType] = useState("in-person");
  const [roomId, setRoomId] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "weekly" | "biweekly">("none");
  const [occurrences, setOccurrences] = useState(4);
  const create = useCreateAppointment();
  const createSeries = useCreateAppointmentSeries();

  useEffect(() => {
    if (open && initialDate) {
      // format as datetime-local in local TZ
      const d = new Date(initialDate);
      const pad = (n: number) => String(n).padStart(2, "0");
      setScheduledAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
  }, [open, initialDate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const iso = new Date(scheduledAt).toISOString();
    const conflict = findConflict(appts ?? [], {
      scheduled_at: iso,
      duration_min: duration,
      provider_id: providerId || null,
      room_id: roomId || null,
    });
    if (conflict) {
      toast.error(
        `Conflicts with ${conflict.patient?.name ?? "another visit"} at ${new Date(conflict.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
      );
      return;
    }
    const base = {
      patient_id: patientId,
      provider_id: providerId || null,
      scheduled_at: iso,
      duration_min: duration,
      reason,
      visit_type: visitType,
      status: "confirmed" as const,
      room_id: roomId || null,
    };
    if (recurrence === "none") {
      await create.mutateAsync(base);
    } else {
      await createSeries.mutateAsync({ base, occurrences, frequency: recurrence });
    }
    setOpen(false);
    setReason("");
    setScheduledAt("");
    setRecurrence("none");
  }

  const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-foreground/80">Patient</label>
            <select className={field} required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Select patient…</option>
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Provider</label>
            <select className={field} value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              <option value="">Unassigned</option>
              {providers?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.specialty ? ` · ${p.specialty}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">When</label>
              <input type="datetime-local" required className={field} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Duration (min)</label>
              <input type="number" min={5} step={5} className={field} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Visit type</label>
            <select className={field} value={visitType} onChange={(e) => setVisitType(e.target.value)}>
              <option value="in-person">In person</option>
              <option value="telehealth">Telehealth</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Reason</label>
            <input className={field} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Follow-up · hypertension" />
          </div>
          {rooms && rooms.length > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground/80">Room</label>
              <select className={field} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">No room</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.location ? ` · ${r.location}` : ""}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Repeats</label>
              <select className={field} value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}>
                <option value="none">Does not repeat</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
              </select>
            </div>
            {recurrence !== "none" && (
              <div>
                <label className="text-xs font-medium text-foreground/80">Occurrences</label>
                <input type="number" min={2} max={26} className={field} value={occurrences} onChange={(e) => setOccurrences(Number(e.target.value))} />
              </div>
            )}
          </div>
          {(() => {
            if (!scheduledAt || !appts) return null;
            const c = findConflict(appts, {
              scheduled_at: new Date(scheduledAt).toISOString(),
              duration_min: duration,
              provider_id: providerId || null,
              room_id: roomId || null,
            });
            return c ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                <div>Conflicts with {c.patient?.name ?? "another visit"} at {new Date(c.scheduled_at).toLocaleString([], { hour: "numeric", minute: "2-digit", weekday: "short" })}.</div>
              </div>
            ) : null;
          })()}
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={create.isPending || createSeries.isPending} className="btn btn-primary">
              {(create.isPending || createSeries.isPending) && <Loader2 className="size-3.5 animate-spin" />} {recurrence === "none" ? "Schedule" : `Schedule ${occurrences}`}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}