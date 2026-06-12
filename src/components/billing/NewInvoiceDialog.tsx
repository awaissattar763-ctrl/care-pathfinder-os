import { useState, type ReactNode, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, X, Receipt, CalendarDays, Video, FlaskConical, Pill } from "lucide-react";
import { usePatients, useProviders } from "@/hooks/queries";
import { useCreateInvoice, usePatientBillables, money, SERVICE_LABELS } from "@/hooks/billing-queries";

const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

type DraftItem = {
  description: string;
  service_type: string;
  reference_id: string | null;
  quantity: number;
  unit_price: number;
};

const DEFAULT_PRICES: Record<string, number> = {
  appointment: 120,
  telemedicine: 90,
  lab: 65,
  prescription: 25,
  procedure: 250,
  other: 50,
};

export function NewInvoiceDialog({ trigger, defaultPatientId }: { trigger: ReactNode; defaultPatientId?: string }) {
  const [open, setOpen] = useState(false);
  const { data: patients } = usePatients();
  const { data: providers } = useProviders();
  const [patientId, setPatientId] = useState(defaultPatientId ?? "");
  const { data: billables, isLoading: billablesLoading } = usePatientBillables(patientId || undefined);
  const [providerId, setProviderId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [adjustment, setAdjustment] = useState("0");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [customDesc, setCustomDesc] = useState("");
  const [customType, setCustomType] = useState("other");
  const [customPrice, setCustomPrice] = useState("");
  const create = useCreateInvoice();

  function hasRef(id: string) {
    return items.some((i) => i.reference_id === id);
  }
  function toggleCharge(item: DraftItem) {
    setItems((cur) =>
      cur.some((i) => i.reference_id === item.reference_id)
        ? cur.filter((i) => i.reference_id !== item.reference_id)
        : [...cur, item],
    );
  }
  function addCustom() {
    const desc = customDesc.trim();
    const price = parseFloat(customPrice);
    if (!desc || !price || price <= 0) return;
    setItems((cur) => [...cur, { description: desc, service_type: customType, reference_id: null, quantity: 1, unit_price: price }]);
    setCustomDesc("");
    setCustomPrice("");
  }
  function removeItem(i: number) {
    setItems((cur) => cur.filter((_, idx) => idx !== i));
  }
  function updatePrice(i: number, price: number) {
    setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, unit_price: price } : it)));
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = subtotal + (parseFloat(adjustment) || 0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patientId || items.length === 0) return;
    await create.mutateAsync({
      patient_id: patientId,
      provider_id: providerId || null,
      due_date: dueDate,
      notes: notes.trim() || null,
      adjustment: parseFloat(adjustment) || 0,
      items,
    });
    setOpen(false);
    setItems([]);
    setNotes("");
    setAdjustment("0");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-4 text-primary" /> New invoice
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="inv-patient" className="text-xs font-medium text-foreground/80">Patient *</label>
              <select id="inv-patient" required value={patientId} onChange={(e) => { setPatientId(e.target.value); setItems([]); }} className={field}>
                <option value="">Select patient…</option>
                {patients?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="inv-provider" className="text-xs font-medium text-foreground/80">Provider</label>
              <select id="inv-provider" value={providerId} onChange={(e) => setProviderId(e.target.value)} className={field}>
                <option value="">Unassigned</option>
                {providers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="inv-due" className="text-xs font-medium text-foreground/80">Due date</label>
              <input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
            </div>
          </div>

          {patientId && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-foreground/80">Link patient charges</div>
              {billablesLoading ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                  <Loader2 className="size-3.5 animate-spin" /> Loading recent activity…
                </div>
              ) : (
                <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
                  {billables?.appointments.map((a) => {
                    const tele = a.visit_type === "telemedicine" || a.visit_type === "video";
                    const item: DraftItem = {
                      description: `${tele ? "Telemedicine" : "Office"} visit — ${new Date(a.scheduled_at).toLocaleDateString()}${a.reason ? ` (${a.reason})` : ""}`,
                      service_type: tele ? "telemedicine" : "appointment",
                      reference_id: a.id,
                      quantity: 1,
                      unit_price: DEFAULT_PRICES[tele ? "telemedicine" : "appointment"],
                    };
                    return (
                      <label key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary/40 cursor-pointer">
                        <input type="checkbox" checked={hasRef(a.id)} onChange={() => toggleCharge(item)} className="accent-[var(--primary)]" />
                        {tele ? <Video className="size-3.5 text-primary shrink-0" /> : <CalendarDays className="size-3.5 text-primary shrink-0" />}
                        <span className="flex-1 truncate">{item.description}</span>
                        <span className="text-xs text-muted-foreground">{money(item.unit_price)}</span>
                      </label>
                    );
                  })}
                  {billables?.labOrders.map((o) => {
                    const item: DraftItem = {
                      description: `Lab ${o.order_number} — ${o.tests.slice(0, 2).map((t) => t.test_name).join(", ")}${o.tests.length > 2 ? "…" : ""}`,
                      service_type: "lab",
                      reference_id: o.id,
                      quantity: Math.max(1, o.tests.length),
                      unit_price: DEFAULT_PRICES.lab,
                    };
                    return (
                      <label key={o.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary/40 cursor-pointer">
                        <input type="checkbox" checked={hasRef(o.id)} onChange={() => toggleCharge(item)} className="accent-[var(--primary)]" />
                        <FlaskConical className="size-3.5 text-primary shrink-0" />
                        <span className="flex-1 truncate">{item.description}</span>
                        <span className="text-xs text-muted-foreground">{o.tests.length || 1} × {money(DEFAULT_PRICES.lab)}</span>
                      </label>
                    );
                  })}
                  {billables?.prescriptions.map((r) => {
                    const item: DraftItem = {
                      description: `Prescription ${r.rx_number} — ${r.drug}`,
                      service_type: "prescription",
                      reference_id: r.id,
                      quantity: 1,
                      unit_price: DEFAULT_PRICES.prescription,
                    };
                    return (
                      <label key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary/40 cursor-pointer">
                        <input type="checkbox" checked={hasRef(r.id)} onChange={() => toggleCharge(item)} className="accent-[var(--primary)]" />
                        <Pill className="size-3.5 text-primary shrink-0" />
                        <span className="flex-1 truncate">{item.description}</span>
                        <span className="text-xs text-muted-foreground">{money(item.unit_price)}</span>
                      </label>
                    );
                  })}
                  {billables &&
                    billables.appointments.length + billables.labOrders.length + billables.prescriptions.length === 0 && (
                      <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                        No recent activity for this patient — add line items below.
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-medium text-foreground/80">Add custom line item</div>
            <div className="flex flex-wrap gap-2">
              <input
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Description"
                className={`${field} flex-1 min-w-[160px]`}
                aria-label="Custom item description"
              />
              <select value={customType} onChange={(e) => setCustomType(e.target.value)} className={`${field} w-auto`} aria-label="Service type">
                {Object.entries(SERVICE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Price"
                className={`${field} w-24`}
                aria-label="Custom item price"
              />
              <button type="button" onClick={addCustom} className="btn btn-secondary h-9">
                <Plus className="size-4" /> Add
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="rounded-lg border border-border divide-y divide-border">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="pill pill--neutral text-[10px] shrink-0">{SERVICE_LABELS[it.service_type]}</span>
                  <span className="flex-1 truncate">{it.description}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{it.quantity} ×</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.unit_price}
                    onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                    className="w-20 h-7 px-2 rounded bg-secondary text-xs text-right tabular-nums outline-none focus:ring-2 focus:ring-ring/40"
                    aria-label={`Unit price for ${it.description}`}
                  />
                  <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${it.description}`}>
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <label htmlFor="inv-notes" className="text-xs font-medium text-foreground/80">Notes / adjustments memo</label>
              <textarea
                id="inv-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Discount applied, insurance copay…"
                className="w-full px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition resize-none"
              />
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <label htmlFor="inv-adj" className="text-xs font-medium text-foreground/80">Adjustment (+/− USD)</label>
                <input
                  id="inv-adj"
                  type="number"
                  step="0.01"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                  className={field}
                />
              </div>
              <div className="flex items-center justify-between text-sm rounded-lg bg-secondary/50 px-3 py-2">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold tabular-nums">{money(total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" disabled={create.isPending || !patientId || items.length === 0} className="btn btn-primary disabled:opacity-50">
              {create.isPending && <Loader2 className="size-4 animate-spin" />} Create draft invoice
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
