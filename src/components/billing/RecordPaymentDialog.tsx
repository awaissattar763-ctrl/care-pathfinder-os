import { useState, type ReactNode, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Banknote } from "lucide-react";
import { useRecordPayment, balanceDue, money, type InvoiceWithRefs } from "@/hooks/billing-queries";

const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

const METHODS = [
  ["card", "Card"],
  ["cash", "Cash"],
  ["bank_transfer", "Bank transfer"],
  ["check", "Check"],
  ["insurance", "Insurance"],
  ["other", "Other"],
] as const;

export function RecordPaymentDialog({ invoice, trigger, fullAmount = false }: {
  invoice: InvoiceWithRefs;
  trigger: ReactNode;
  /** Pre-fill the full remaining balance ("Mark as paid" flow) */
  fullAmount?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const due = balanceDue(invoice);
  const [amount, setAmount] = useState(fullAmount ? String(due) : "");
  const [method, setMethod] = useState("card");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const record = useRecordPayment();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    await record.mutateAsync({
      invoice_id: invoice.id,
      amount: Math.min(amt, due),
      method,
      reference: reference.trim() || null,
      notes: notes.trim() || null,
    });
    setOpen(false);
    setAmount("");
    setReference("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && fullAmount) setAmount(String(balanceDue(invoice))); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="size-4 text-primary" /> Record payment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-lg bg-secondary/50 p-3 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">{invoice.invoice_number} · Balance due</span>
            <span className="font-semibold tabular-nums">{money(due)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="pay-amount" className="text-xs font-medium text-foreground/80">Amount (USD)</label>
              <input
                id="pay-amount"
                type="number"
                min="0.01"
                step="0.01"
                max={due}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={field}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pay-method" className="text-xs font-medium text-foreground/80">Method</label>
              <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)} className={field}>
                {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pay-ref" className="text-xs font-medium text-foreground/80">Reference (optional)</label>
            <input
              id="pay-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Receipt no, transaction ID…"
              className={field}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pay-notes" className="text-xs font-medium text-foreground/80">Notes (optional)</label>
            <textarea
              id="pay-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition resize-none"
            />
          </div>
          <DialogFooter>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" disabled={record.isPending} className="btn btn-primary">
              {record.isPending && <Loader2 className="size-4 animate-spin" />} Record payment
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
