import { useState, type ReactNode, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCreateLabOrder, usePatients, useProviders } from "@/hooks/queries";
import { Loader2, Plus, X, FlaskConical } from "lucide-react";

const PRESETS: { code: string; name: string }[] = [
  { code: "57021-8", name: "CBC with differential" },
  { code: "24323-8", name: "Comprehensive metabolic panel" },
  { code: "24331-1", name: "Lipid panel" },
  { code: "4548-4", name: "Hemoglobin A1c" },
  { code: "3016-3", name: "TSH" },
  { code: "2160-0", name: "Creatinine" },
  { code: "5811-5", name: "Urinalysis" },
  { code: "6690-2", name: "WBC count" },
  { code: "2093-3", name: "Cholesterol total" },
  { code: "1988-5", name: "C-reactive protein" },
];

const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

export function NewLabOrderDialog({ trigger, defaultPatientId }: { trigger: ReactNode; defaultPatientId?: string }) {
  const [open, setOpen] = useState(false);
  const { data: patients } = usePatients();
  const { data: providers } = useProviders();
  const [patientId, setPatientId] = useState(defaultPatientId ?? "");
  const [providerId, setProviderId] = useState("");
  const [priority, setPriority] = useState("routine");
  const [facility, setFacility] = useState("");
  const [notes, setNotes] = useState("");
  const [tests, setTests] = useState<{ test_code: string; test_name: string }[]>([]);
  const [customName, setCustomName] = useState("");
  const create = useCreateLabOrder();

  function togglePreset(t: { code: string; name: string }) {
    setTests((cur) =>
      cur.some((x) => x.test_code === t.code)
        ? cur.filter((x) => x.test_code !== t.code)
        : [...cur, { test_code: t.code, test_name: t.name }],
    );
  }
  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    setTests((cur) => [...cur, { test_code: "", test_name: name }]);
    setCustomName("");
  }
  function removeTest(i: number) {
    setTests((cur) => cur.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patientId || tests.length === 0) return;
    await create.mutateAsync({
      patient_id: patientId,
      provider_id: providerId || null,
      priority,
      lab_facility: facility || null,
      clinical_notes: notes || null,
      tests,
    });
    setOpen(false);
    setTests([]); setNotes(""); setFacility("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FlaskConical className="size-4 text-primary" /> New lab order</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Patient</label>
              <select className={field} required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Select patient…</option>
                {patients?.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Ordering provider</label>
              <select className={field} value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                <option value="">Unassigned</option>
                {providers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Priority</label>
              <select className={field} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="routine">Routine</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Lab facility</label>
              <input className={field} value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="Quest · LabCorp · in-house" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/80">Tests</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PRESETS.map((t) => {
                const active = tests.some((x) => x.test_code === t.code);
                return (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => togglePreset(t)}
                    className={`pill text-xs ${active ? "pill--info ring-2 ring-ring/40" : "pill--neutral hover:opacity-100 opacity-80"} transition`}
                  >
                    {active && <span className="mr-1">✓</span>}{t.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className={field}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Add custom test name…"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              />
              <button type="button" onClick={addCustom} className="btn btn-secondary"><Plus className="size-4" /> Add</button>
            </div>
            {tests.length > 0 && (
              <ul className="mt-2 space-y-1">
                {tests.map((t, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-secondary/60 rounded px-2 py-1.5">
                    <span className="truncate">{t.test_name}{t.test_code ? ` · ${t.test_code}` : ""}</span>
                    <button type="button" onClick={() => removeTest(i)} className="text-muted-foreground hover:text-destructive" aria-label="Remove test"><X className="size-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/80">Clinical notes</label>
            <textarea rows={2} className={`${field} h-auto py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Indication, fasting, special handling…" />
          </div>

          <DialogFooter className="pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={create.isPending || !patientId || tests.length === 0} className="btn btn-primary">
              {create.isPending && <Loader2 className="size-3.5 animate-spin" />} Submit order
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}