import { useState, type ReactNode, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCreatePrescription, usePatients } from "@/hooks/queries";
import { Loader2 } from "lucide-react";

export function NewPrescriptionDialog({ trigger, defaultPatientId }: { trigger: ReactNode; defaultPatientId?: string }) {
  const [open, setOpen] = useState(false);
  const { data: patients } = usePatients();
  const [patientId, setPatientId] = useState(defaultPatientId ?? "");
  const [drug, setDrug] = useState("");
  const [sig, setSig] = useState("");
  const [quantity, setQuantity] = useState("#30");
  const [refills, setRefills] = useState(0);
  const [pharmacy, setPharmacy] = useState("");
  const [status, setStatus] = useState("Draft");
  const create = useCreatePrescription();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      patient_id: patientId,
      drug, sig, quantity, refills, pharmacy: pharmacy || null, status,
    });
    setOpen(false); setDrug(""); setSig(""); setPharmacy("");
  }

  const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New prescription</DialogTitle>
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
            <label className="text-xs font-medium text-foreground/80">Drug & strength</label>
            <input className={field} required value={drug} onChange={(e) => setDrug(e.target.value)} placeholder="Lisinopril 10 mg" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Sig</label>
            <input className={field} required value={sig} onChange={(e) => setSig(e.target.value)} placeholder="1 tab PO daily" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Quantity</label>
              <input className={field} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Refills</label>
              <input type="number" min={0} max={11} className={field} value={refills} onChange={(e) => setRefills(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Status</label>
              <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Draft</option>
                <option>Sent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Pharmacy</label>
            <input className={field} value={pharmacy} onChange={(e) => setPharmacy(e.target.value)} placeholder="CVS · Mission St" />
          </div>
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn btn-primary">
              {create.isPending && <Loader2 className="size-3.5 animate-spin" />} Save Rx
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}