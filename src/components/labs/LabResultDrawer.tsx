import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@tanstack/react-router";
import { FlaskConical, User, Calendar, ClipboardCheck, AlertTriangle, Plus, Loader2, X } from "lucide-react";
import { useAddLabResult, type LabOrderWithRefs } from "@/hooks/queries";

const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

function flagPill(f: string) {
  switch (f) {
    case "critical": return "pill--danger";
    case "high":
    case "low":
    case "abnormal": return "pill--warning";
    case "normal": return "pill--success";
    default: return "pill--neutral";
  }
}

export function LabResultDrawer({
  order, open, onOpenChange, onAdvance,
}: {
  order: LabOrderWithRefs | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdvance: (status: string) => void;
}) {
  const add = useAddLabResult();
  const [draft, setDraft] = useState<{ test_code: string; test_name: string; value: string; unit: string; reference_range: string; flag: string; notes: string }>({
    test_code: "", test_name: "", value: "", unit: "", reference_range: "", flag: "normal", notes: "",
  });

  if (!order) return null;

  async function submitResult(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !draft.test_name.trim() || !draft.value.trim()) return;
    await add.mutateAsync({
      order_id: order.id,
      patient_id: order.patient_id,
      test_code: draft.test_code || null,
      test_name: draft.test_name.trim(),
      value: draft.value.trim(),
      unit: draft.unit || null,
      reference_range: draft.reference_range || null,
      flag: draft.flag,
      notes: draft.notes || null,
    });
    setDraft({ test_code: "", test_name: "", value: "", unit: "", reference_range: "", flag: "normal", notes: "" });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold inline-flex items-center gap-1.5">
                <FlaskConical className="size-3" /> Lab order
              </div>
              <span className={`pill ${order.status === "resulted" ? "pill--success" : order.status === "collected" ? "pill--warning" : order.status === "cancelled" ? "pill--neutral" : "pill--info"}`}>{order.status}</span>
            </div>
            <SheetTitle className="text-lg mt-1.5">{order.order_number}</SheetTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5"><Calendar className="size-3.5" /> Ordered {new Date(order.ordered_at).toLocaleString()}</span>
              {order.lab_facility && <span>· {order.lab_facility}</span>}
              {order.priority === "stat" && <span className="pill pill--danger text-[10px]">STAT</span>}
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <div className="label-eyebrow mb-2">Patient</div>
            {order.patient ? (
              <Link to="/patients/$patientId" params={{ patientId: order.patient.id }} className="block surface p-4 hover:bg-primary/[0.04] transition">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"><User className="size-4" /></div>
                  <div>
                    <div className="text-sm font-medium">{order.patient.name}</div>
                    <div className="text-xs text-muted-foreground">MRN {order.patient.mrn}</div>
                  </div>
                </div>
              </Link>
            ) : <div className="text-sm text-muted-foreground">Unassigned</div>}
          </section>

          <section>
            <div className="label-eyebrow mb-2">Tests ordered</div>
            <ul className="space-y-1.5">
              {order.tests.length === 0 ? (
                <li className="text-xs text-muted-foreground">No tests recorded.</li>
              ) : order.tests.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm bg-secondary/60 rounded px-3 py-2">
                  <span>{t.test_name}</span>
                  {t.test_code && <span className="text-[11px] text-muted-foreground tabular-nums">{t.test_code}</span>}
                </li>
              ))}
            </ul>
          </section>

          {order.clinical_notes && (
            <section>
              <div className="label-eyebrow mb-2">Clinical notes</div>
              <div className="surface p-3 text-sm whitespace-pre-wrap">{order.clinical_notes}</div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="label-eyebrow inline-flex items-center gap-1.5"><ClipboardCheck className="size-3.5" /> Results</div>
              <span className="text-xs text-muted-foreground">{order.results.length} recorded</span>
            </div>
            {order.results.length === 0 ? (
              <div className="text-xs text-muted-foreground mb-3">No results yet — record values below.</div>
            ) : (
              <ul className="space-y-2 mb-3">
                {order.results.map((r) => (
                  <li key={r.id} className="surface p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium truncate">{r.test_name}</div>
                      <span className={`pill ${flagPill(r.flag)} text-[10px]`}>
                        {r.flag === "critical" && <AlertTriangle className="size-3 mr-0.5" />}{r.flag}
                      </span>
                    </div>
                    <div className="mt-1 text-sm tabular-nums">
                      <span className="font-semibold">{r.value}</span>
                      {r.unit && <span className="text-muted-foreground"> {r.unit}</span>}
                      {r.reference_range && <span className="text-xs text-muted-foreground"> · ref {r.reference_range}</span>}
                    </div>
                    {r.notes && <div className="text-xs text-muted-foreground mt-1">{r.notes}</div>}
                  </li>
                ))}
              </ul>
            )}

            {order.status !== "cancelled" && (
              <form onSubmit={submitResult} className="surface p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className={field} placeholder="Test name" value={draft.test_name} onChange={(e) => setDraft({ ...draft, test_name: e.target.value })} required />
                  <input className={field} placeholder="LOINC code (optional)" value={draft.test_code} onChange={(e) => setDraft({ ...draft, test_code: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input className={field} placeholder="Value" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} required />
                  <input className={field} placeholder="Unit" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
                  <input className={field} placeholder="Ref range" value={draft.reference_range} onChange={(e) => setDraft({ ...draft, reference_range: e.target.value })} />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select className={field} value={draft.flag} onChange={(e) => setDraft({ ...draft, flag: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                    <option value="abnormal">Abnormal</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button type="submit" disabled={add.isPending} className="btn btn-primary">
                    {add.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add result
                  </button>
                </div>
                <input className={field} placeholder="Notes (optional)" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </form>
            )}
          </section>

          <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {order.status === "ordered" && (
                <button className="btn btn-secondary btn-sm" onClick={() => onAdvance("collected")}>Mark collected</button>
              )}
              {(order.status === "ordered" || order.status === "collected") && (
                <button className="btn btn-secondary btn-sm" onClick={() => onAdvance("resulted")}>Mark resulted</button>
              )}
            </div>
            {order.status !== "cancelled" && order.status !== "resulted" && (
              <button className="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10" onClick={() => onAdvance("cancelled")}>
                <X className="size-4" /> Cancel order
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}