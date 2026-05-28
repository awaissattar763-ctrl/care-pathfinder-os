import { useState, type ReactNode, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCreateAppointment, usePatients } from "@/hooks/queries";
import { Loader2 } from "lucide-react";

export function NewAppointmentDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: patients } = usePatients();
  const [patientId, setPatientId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [visitType, setVisitType] = useState("in-person");
  const create = useCreateAppointment();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      patient_id: patientId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_min: duration,
      reason,
      visit_type: visitType,
      status: "confirmed",
    });
    setOpen(false); setReason(""); setScheduledAt("");
  }

  const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn btn-primary">
              {create.isPending && <Loader2 className="size-3.5 animate-spin" />} Schedule
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}