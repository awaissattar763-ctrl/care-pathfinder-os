import { useState, type ReactNode, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCreatePatient } from "@/hooks/queries";
import { Loader2 } from "lucide-react";

export function NewPatientDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mrn, setMrn] = useState(() => `MRN-${Math.floor(10000 + Math.random() * 89999)}`);
  const [sex, setSex] = useState("F");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [conditions, setConditions] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const create = useCreatePatient();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      name,
      mrn,
      sex,
      dob: dob || null,
      email: email || null,
      phone: phone || null,
      urgency,
      conditions: conditions ? conditions.split(",").map((c) => c.trim()).filter(Boolean) : [],
    });
    setOpen(false);
    setName(""); setEmail(""); setPhone(""); setDob(""); setConditions("");
    setMrn(`MRN-${Math.floor(10000 + Math.random() * 89999)}`);
  }

  const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Full name</label>
              <input className={field} required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">MRN</label>
              <input className={field} required value={mrn} onChange={(e) => setMrn(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Date of birth</label>
              <input type="date" className={field} value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Sex</label>
              <select className={field} value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="X">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Email</label>
              <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Phone</label>
              <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/80">Conditions (comma-separated)</label>
              <input className={field} value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Hypertension, Asthma" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Triage</label>
              <select className={field} value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                <option value="stable">Stable</option>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn btn-primary">
              {create.isPending && <Loader2 className="size-3.5 animate-spin" />} Save patient
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}