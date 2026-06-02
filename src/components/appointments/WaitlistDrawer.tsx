import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useWaitlist, useUpdateWaitlist, useCreateWaitlist, usePatients, useProviders } from "@/hooks/queries";
import { EmptyState } from "@/components/EmptyState";
import { Clock, ListPlus, Plus, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

export function WaitlistDrawer({ open, onOpenChange, onOffer }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOffer?: (waitlistId: string, patientId: string) => void;
}) {
  const { data, isLoading } = useWaitlist("waiting");
  const { data: patients } = usePatients();
  const { data: providers } = useProviders();
  const update = useUpdateWaitlist();
  const create = useCreateWaitlist();
  const [adding, setAdding] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(30);
  const [priority, setPriority] = useState(0);

  const patientName = (id: string) => patients?.find((p) => p.id === id)?.name ?? "Unknown patient";
  const patientMrn = (id: string) => patients?.find((p) => p.id === id)?.mrn ?? "";

  async function add(e: FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      patient_id: patientId,
      provider_id: providerId || null,
      reason,
      duration_min: duration,
      priority,
      visit_type: "in-person",
      status: "waiting",
    });
    setAdding(false);
    setReason("");
    setPatientId("");
  }

  const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <SheetHeader>
            <div className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold">Waitlist</div>
            <SheetTitle className="text-lg mt-1.5">Patients awaiting a slot</SheetTitle>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{data?.length ?? 0} waiting</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setAdding((v) => !v)}>
              <Plus className="size-3.5" /> {adding ? "Close" : "Add"}
            </button>
          </div>

          {adding && (
            <form onSubmit={add} className="surface p-3 space-y-2">
              <select className={field} required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Patient…</option>
                {patients?.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>)}
              </select>
              <select className={field} value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                <option value="">Any provider</option>
                {providers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className={field} placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className={field} min={5} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                <select className={field} value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
                  <option value={0}>Normal</option>
                  <option value={1}>High</option>
                  <option value={2}>Urgent</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={create.isPending}>
                <ListPlus className="size-3.5" /> Add to waitlist
              </button>
            </form>
          )}

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : !data || data.length === 0 ? (
            <EmptyState icon={Clock} title="Waitlist is clear" description="Patients added here get auto-suggested when a slot opens." />
          ) : (
            <ol className="space-y-2">
              {data.map((w) => (
                <li key={w.id} className="surface p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UserRound className="size-3.5 text-muted-foreground" />
                      <span className="truncate">{patientName(w.patient_id)}</span>
                      {w.priority > 0 && (
                        <span className={`pill ${w.priority >= 2 ? "pill--danger" : "pill--warning"}`}>
                          {w.priority >= 2 ? "Urgent" : "High"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      MRN {patientMrn(w.patient_id)} · {w.duration_min}m{w.reason ? ` · ${w.reason}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {onOffer && (
                      <button className="btn btn-secondary btn-sm" onClick={() => onOffer(w.id, w.patient_id)}>Offer slot</button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => update.mutate({ id: w.id, status: "cancelled" })}
                    >Remove</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}