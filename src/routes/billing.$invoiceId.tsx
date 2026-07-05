import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, Plus, Trash2, Receipt, DollarSign, RefreshCcw, Printer } from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import {
  LINE_ITEM_KINDS,
  LINE_ITEM_KIND_LABEL,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  INVOICE_STATUSES,
  type LineItemKind,
  type PaymentMethod,
  type InvoiceStatus,
} from "@/lib/constants";
import {
  useInvoice,
  useInvoiceLineItems,
  useInvoicePayments,
  useAddLineItem,
  useDeleteLineItem,
  useRecordPayment,
  useUpdateInvoice,
  useIssueCreditNote,
} from "@/hooks/queries/billing";

export const Route = createFileRoute("/billing/$invoiceId")({
  component: InvoiceDetail,
  head: () => ({ meta: [{ title: "Invoice — HealthOS" }] }),
});

function InvoiceDetail() {
  const { invoiceId } = Route.useParams();
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: items } = useInvoiceLineItems(invoiceId);
  const { data: payments } = useInvoicePayments(invoiceId);
  const update = useUpdateInvoice();

  const [showPayment, setShowPayment] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading invoice…</div>;
  if (!invoice) return <EmptyState icon={Receipt} title="Invoice not found" description="This invoice may have been deleted or you don't have access." />;

  const paid = (payments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div>
      <div className="mb-4">
        <Link to="/billing" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to billing
        </Link>
      </div>

      <PageHeader
        eyebrow={`Invoice ${invoice.invoice_number}`}
        title={invoice.patient?.name ?? "Invoice"}
        description={invoice.patient?.mrn ? `MRN ${invoice.patient.mrn} · Issued ${formatDate(invoice.issued_at)}` : undefined}
        actions={
          <>
            <select
              value={invoice.status}
              onChange={(e) => update.mutate({ id: invoice.id, patch: { status: e.target.value } })}
              className="h-9 px-3 rounded-lg bg-secondary text-sm outline-none"
              aria-label="Invoice status"
            >
              {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={() => window.print()}><Printer className="size-4" /> Print</button>
            <button className="btn btn-secondary" onClick={() => setShowRefund(true)}><RefreshCcw className="size-4" /> Refund</button>
            <button className="btn btn-primary" onClick={() => setShowPayment(true)} disabled={Number(invoice.balance_due) <= 0}>
              <DollarSign className="size-4" /> Record payment
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Subtotal" value={formatCurrency(Number(invoice.subtotal))} />
        <SummaryCard label="Tax / Discount" value={`${formatCurrency(Number(invoice.tax))} / -${formatCurrency(Number(invoice.discount))}`} />
        <SummaryCard label="Total" value={formatCurrency(Number(invoice.total))} highlight />
        <SummaryCard label="Balance due" value={formatCurrency(Number(invoice.balance_due))} tone={Number(invoice.balance_due) > 0 ? "warn" : "ok"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LineItemsCard invoiceId={invoice.id} items={items ?? []} locked={invoice.status === "Cancelled" || invoice.status === "Refunded"} />
          <PaymentsCard payments={payments ?? []} />
        </div>
        <aside className="space-y-6">
          <div className="surface p-5">
            <div className="label-eyebrow">Adjustments</div>
            <div className="mt-3 space-y-2">
              <NumberField label="Tax" value={Number(invoice.tax)} onCommit={(v) => update.mutate({ id: invoice.id, patch: { tax: v } })} />
              <NumberField label="Discount" value={Number(invoice.discount)} onCommit={(v) => update.mutate({ id: invoice.id, patch: { discount: v } })} />
            </div>
          </div>
          <div className="surface p-5">
            <div className="label-eyebrow">Notes</div>
            <textarea
              defaultValue={invoice.notes ?? ""}
              onBlur={(e) => e.target.value !== (invoice.notes ?? "") && update.mutate({ id: invoice.id, patch: { notes: e.target.value } })}
              rows={4}
              className="w-full mt-2 px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="surface p-5">
            <div className="label-eyebrow">Reconciliation</div>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between"><span>Paid to date</span><span className="tabular-nums text-foreground">{formatCurrency(paid)}</span></div>
              <div className="flex justify-between"><span>Balance</span><span className="tabular-nums text-foreground">{formatCurrency(Number(invoice.balance_due))}</span></div>
              {invoice.due_date && <div className="flex justify-between"><span>Due</span><span className="text-foreground">{formatDate(invoice.due_date)}</span></div>}
            </div>
          </div>
        </aside>
      </div>

      {showPayment && (
        <PaymentDialog
          invoiceId={invoice.id}
          patientId={invoice.patient_id}
          balance={Number(invoice.balance_due)}
          onClose={() => setShowPayment(false)}
        />
      )}
      {showRefund && (
        <RefundDialog
          invoiceId={invoice.id}
          patientId={invoice.patient_id}
          max={Number(invoice.total)}
          onClose={() => setShowRefund(false)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, highlight, tone }: { label: string; value: string; highlight?: boolean; tone?: "warn" | "ok" }) {
  return (
    <div className="surface p-5">
      <div className="label-eyebrow">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${highlight ? "text-primary" : tone === "warn" ? "text-destructive" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function NumberField({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        step="0.01"
        min={0}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = Number(v || 0);
          if (n !== value) onCommit(n);
        }}
        className="w-24 h-8 px-2 rounded-md bg-secondary text-right tabular-nums outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

function LineItemsCard({
  invoiceId,
  items,
  locked,
}: {
  invoiceId: string;
  items: Array<{ id: string; kind: string; description: string; quantity: number; unit_price: number; amount: number }>;
  locked: boolean;
}) {
  const add = useAddLineItem();
  const del = useDeleteLineItem();
  const [kind, setKind] = useState<LineItemKind>("consultation");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const field = "h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40";

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description) return;
    await add.mutateAsync({ invoice_id: invoiceId, kind, description, quantity: qty, unit_price: price });
    setDescription("");
    setQty(1);
    setPrice(0);
  }

  return (
    <div className="surface">
      <div className="section-head">
        <div className="flex items-center gap-2.5">
          <Receipt className="size-4 text-primary" aria-hidden />
          <div>
            <div className="section-head__title">Line items</div>
            <div className="section-head__sub">{items.length} entries</div>
          </div>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground text-center">No items yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Kind</th><th>Description</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Amount</th><th /></tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td><span className="pill pill--neutral">{LINE_ITEM_KIND_LABEL[it.kind as LineItemKind] ?? it.kind}</span></td>
                <td>{it.description}</td>
                <td className="tabular-nums text-right">{Number(it.quantity)}</td>
                <td className="tabular-nums text-right">{formatCurrency(Number(it.unit_price))}</td>
                <td className="tabular-nums text-right">{formatCurrency(Number(it.amount))}</td>
                <td className="text-right">
                  {!locked && (
                    <button
                      onClick={() => del.mutate({ id: it.id, invoice_id: invoiceId })}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove line item"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!locked && (
        <form onSubmit={onAdd} className="p-4 border-t border-border grid grid-cols-1 md:grid-cols-[130px_1fr_80px_100px_auto] gap-2 items-end">
          <label className="text-xs">
            <span className="text-muted-foreground block mb-1">Kind</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as LineItemKind)} className={`${field} w-full`}>
              {LINE_ITEM_KINDS.map((k) => <option key={k} value={k}>{LINE_ITEM_KIND_LABEL[k]}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground block mb-1">Description</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Follow-up visit" className={`${field} w-full`} />
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground block mb-1">Qty</span>
            <input type="number" min={1} step="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} className={`${field} w-full text-right tabular-nums`} />
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground block mb-1">Unit price</span>
            <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} className={`${field} w-full text-right tabular-nums`} />
          </label>
          <button type="submit" disabled={add.isPending} className="btn btn-primary btn-sm h-9">
            <Plus className="size-3.5" /> Add
          </button>
        </form>
      )}
    </div>
  );
}

function PaymentsCard({ payments }: { payments: Array<{ id: string; amount: number; method: string; reference: string | null; received_at: string; notes: string | null }> }) {
  return (
    <div className="surface">
      <div className="section-head">
        <div className="flex items-center gap-2.5">
          <DollarSign className="size-4 text-primary" aria-hidden />
          <div>
            <div className="section-head__title">Payments</div>
            <div className="section-head__sub">{payments.length} recorded</div>
          </div>
        </div>
      </div>
      {payments.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground text-center">No payments recorded yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Method</th><th>Reference</th><th className="text-right">Amount</th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="text-muted-foreground">{formatDateTime(p.received_at)}</td>
                <td><span className="pill pill--info">{PAYMENT_METHOD_LABEL[p.method as PaymentMethod] ?? p.method}</span></td>
                <td className="text-muted-foreground">{p.reference ?? "—"}</td>
                <td className="tabular-nums text-right">{formatCurrency(Number(p.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PaymentDialog({ invoiceId, patientId, balance, onClose }: { invoiceId: string; patientId: string; balance: number; onClose: () => void }) {
  const record = useRecordPayment();
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await record.mutateAsync({
      invoice_id: invoiceId,
      patient_id: patientId,
      amount,
      method,
      reference: reference || null,
      notes: notes || null,
    });
    onClose();
  }

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Record payment</h2>
        <p className="text-xs text-muted-foreground">Balance due: <span className="text-foreground tabular-nums font-medium">{formatCurrency(balance)}</span></p>
        <div>
          <label className="text-xs text-muted-foreground">Amount</label>
          <input type="number" min={0.01} step="0.01" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={`${field} text-right tabular-nums`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={field}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>)}
          </select>
          {method === "online" && <p className="text-[11px] text-muted-foreground mt-1">Online payment gateway not yet configured — record manually.</p>}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Reference</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Receipt / txn ID" className={field} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={record.isPending} className="btn btn-primary">Record</button>
        </div>
      </form>
    </div>
  );
}

function RefundDialog({ invoiceId, patientId, max, onClose }: { invoiceId: string; patientId: string; max: number; onClose: () => void }) {
  const issue = useIssueCreditNote();
  const [amount, setAmount] = useState(max);
  const [reason, setReason] = useState("");
  const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await issue.mutateAsync({ invoice_id: invoiceId, patient_id: patientId, amount, reason: reason || null });
    onClose();
  }

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Issue refund / credit note</h2>
        <p className="text-xs text-muted-foreground">Marking the invoice as Refunded.</p>
        <div>
          <label className="text-xs text-muted-foreground">Amount</label>
          <input type="number" min={0.01} step="0.01" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={`${field} text-right tabular-nums`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Reason</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Duplicate charge, service not rendered…" className={field} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={issue.isPending} className="btn btn-primary">Issue credit</button>
        </div>
      </form>
    </div>
  );
}