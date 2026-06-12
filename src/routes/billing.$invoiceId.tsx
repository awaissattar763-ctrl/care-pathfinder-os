import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Printer, FileDown, Send, Ban, Banknote, CheckCircle2, Plus, X,
  Receipt, History, AlertTriangle, Loader2, CircleDot, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Can } from "@/components/rbac/Can";
import { InvoiceStatusPill } from "@/components/billing/InvoiceStatusPill";
import { RecordPaymentDialog } from "@/components/billing/RecordPaymentDialog";
import { printInvoice } from "@/components/billing/invoice-print";
import {
  useInvoice, useInvoiceActivity, useUpdateInvoice, useVoidInvoice,
  useAddInvoiceItem, useRemoveInvoiceItem, balanceDue, effectiveStatus, money,
  SERVICE_LABELS, STATUS_LABELS,
} from "@/hooks/billing-queries";
import { usePermissions } from "@/lib/rbac";

export const Route = createFileRoute("/billing/$invoiceId")({ component: InvoiceDetailPage });

const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams();
  const { data: inv, isLoading, isError, refetch } = useInvoice(invoiceId);
  const { data: activity } = useInvoiceActivity(invoiceId);
  const update = useUpdateInvoice();
  const voidInv = useVoidInvoice();
  const addItem = useAddInvoiceItem();
  const removeItem = useRemoveInvoiceItem();
  const perms = usePermissions();
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("other");
  const [newPrice, setNewPrice] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (isError || !inv) {
    return (
      <div className="surface p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="size-8 mx-auto text-warning mb-3" />
        <h2 className="font-semibold">Invoice not found</h2>
        <p className="text-sm text-muted-foreground mt-1">It may have been removed, or the link is incorrect.</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => refetch()} className="btn btn-secondary"><RefreshCw className="size-4" /> Retry</button>
          <Link to="/billing" className="btn btn-primary"><ArrowLeft className="size-4" /> Billing</Link>
        </div>
      </div>
    );
  }

  const status = effectiveStatus(inv);
  const due = balanceDue(inv);
  const isDraft = inv.status === "draft";
  const isVoided = inv.status === "voided";
  const canWrite = perms.has("billing.write");
  const canVoid = perms.has("billing.void");

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <Link to="/billing" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="size-3" /> Billing
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{inv.invoice_number}</h1>
            <InvoiceStatusPill invoice={inv} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {inv.patient?.name ?? "Unassigned"} {inv.patient?.mrn ? `· MRN ${inv.patient.mrn}` : ""}
            {inv.provider?.name ? ` · ${inv.provider.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary" onClick={() => printInvoice(inv)}>
            <Printer className="size-4" /> Print
          </button>
          <button className="btn btn-secondary" onClick={() => printInvoice(inv)} title="Opens the print dialog — choose 'Save as PDF'">
            <FileDown className="size-4" /> PDF
          </button>
          {canWrite && isDraft && (
            <button
              className="btn btn-primary"
              disabled={update.isPending || inv.items.length === 0}
              onClick={() => update.mutate({ id: inv.id, patch: { status: "sent" }, action: "invoice.send" })}
            >
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send invoice
            </button>
          )}
          {canWrite && inv.status === "sent" && (
            <button
              className="btn btn-secondary"
              onClick={() => update.mutate({ id: inv.id, patch: { status: "pending" }, action: "invoice.mark_pending" })}
            >
              <CircleDot className="size-4" /> Mark pending
            </button>
          )}
          {canWrite && !isVoided && !isDraft && due > 0 && (
            <>
              <RecordPaymentDialog
                invoice={inv}
                trigger={<button className="btn btn-secondary"><Banknote className="size-4" /> Record payment</button>}
              />
              <RecordPaymentDialog
                invoice={inv}
                fullAmount
                trigger={<button className="btn btn-primary"><CheckCircle2 className="size-4" /> Mark as paid</button>}
              />
            </>
          )}
          {canVoid && !isVoided && inv.status !== "paid" && (
            <button className="btn btn-ghost text-destructive hover:bg-destructive/10" onClick={() => setVoidOpen(true)}>
              <Ban className="size-4" /> Void
            </button>
          )}
        </div>
      </div>

      {isVoided && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm flex items-center gap-2">
          <Ban className="size-4 text-destructive shrink-0" />
          <span>
            Voided {inv.voided_at ? new Date(inv.voided_at).toLocaleString() : ""}
            {inv.void_reason ? ` — ${inv.void_reason}` : ""}
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: line items + payments */}
        <div className="lg:col-span-2 space-y-4">
          <section className="surface overflow-hidden">
            <div className="section-head">
              <div>
                <div className="section-head__title">Line items</div>
                <div className="section-head__sub">{inv.items.length} item{inv.items.length === 1 ? "" : "s"}</div>
              </div>
            </div>
            {inv.items.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No line items yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {inv.items.map((it) => (
                  <li key={it.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                    <span className="pill pill--neutral text-[10px] shrink-0">{SERVICE_LABELS[it.service_type] ?? it.service_type}</span>
                    <span className="flex-1 min-w-0 truncate">{it.description}</span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {Number(it.quantity)} × {money(Number(it.unit_price))}
                    </span>
                    <span className="font-medium tabular-nums shrink-0">{money(Number(it.amount))}</span>
                    {canWrite && isDraft && (
                      <button
                        onClick={() => removeItem.mutate({ id: it.id, invoice_id: inv.id })}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${it.description}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canWrite && isDraft && (
              <form
                className="px-5 py-3 border-t border-border flex flex-wrap gap-2 items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  const price = parseFloat(newPrice);
                  if (!newDesc.trim() || !price || price <= 0) return;
                  addItem.mutate({ invoice_id: inv.id, description: newDesc.trim(), service_type: newType, unit_price: price, quantity: 1 });
                  setNewDesc(""); setNewPrice("");
                }}
              >
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Add line item…" className={`${field} flex-1 min-w-[140px] h-8 text-xs`} aria-label="New line item description" />
                <select value={newType} onChange={(e) => setNewType(e.target.value)} className={`${field} w-auto h-8 text-xs`} aria-label="Service type">
                  {Object.entries(SERVICE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <input type="number" min="0.01" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Price" className={`${field} w-24 h-8 text-xs`} aria-label="New line item price" />
                <button type="submit" disabled={addItem.isPending} className="btn btn-secondary btn-sm"><Plus className="size-3.5" /> Add</button>
              </form>
            )}
            {/* Totals */}
            <div className="px-5 py-4 border-t border-border bg-secondary/20">
              <div className="ml-auto max-w-[260px] space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{money(Number(inv.subtotal))}</span></div>
                {Number(inv.adjustment) !== 0 && (
                  <div className="flex justify-between text-muted-foreground"><span>Adjustment</span><span className="tabular-nums">{money(Number(inv.adjustment))}</span></div>
                )}
                <div className="flex justify-between font-semibold border-t border-border pt-1.5"><span>Total</span><span className="tabular-nums">{money(Number(inv.total))}</span></div>
                <div className="flex justify-between text-success"><span>Paid</span><span className="tabular-nums">{money(Number(inv.amount_paid))}</span></div>
                <div className={`flex justify-between font-semibold ${due > 0 && !isVoided ? "text-destructive" : "text-success"}`}>
                  <span>Balance due</span><span className="tabular-nums">{money(due)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="surface overflow-hidden">
            <div className="section-head">
              <div>
                <div className="section-head__title">Payment history</div>
                <div className="section-head__sub">{inv.payments.length} payment{inv.payments.length === 1 ? "" : "s"}</div>
              </div>
              {canWrite && !isVoided && !isDraft && due > 0 && (
                <RecordPaymentDialog invoice={inv} trigger={<button className="btn btn-ghost btn-sm"><Plus className="size-3.5" /> Add</button>} />
              )}
            </div>
            {inv.payments.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No payments recorded yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {[...inv.payments].sort((a, b) => +new Date(b.paid_at) - +new Date(a.paid_at)).map((p) => (
                  <li key={p.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                    <div className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                      <Banknote className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium capitalize">{p.method.replace("_", " ")}{p.reference ? ` · ${p.reference}` : ""}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.paid_at).toLocaleString()}{p.notes ? ` — ${p.notes}` : ""}
                      </div>
                    </div>
                    <span className="font-semibold tabular-nums text-success">+{money(Number(p.amount))}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: billing summary + status timeline + activity */}
        <div className="space-y-4">
          <section className="surface p-5">
            <div className="section-head__title mb-3">Billing summary</div>
            <dl className="space-y-2.5 text-sm">
              <Row k="Status" v={STATUS_LABELS[status]} />
              <Row k="Issued" v={new Date(inv.issue_date).toLocaleDateString()} />
              <Row k="Due" v={new Date(inv.due_date).toLocaleDateString()} />
              <Row k="Patient" v={inv.patient?.name ?? "—"} />
              <Row k="Provider" v={inv.provider?.name ?? "—"} />
              {inv.notes && <Row k="Notes" v={inv.notes} />}
            </dl>
          </section>

          <section className="surface overflow-hidden">
            <div className="section-head">
              <div className="section-head__title flex items-center gap-2"><History className="size-4 text-primary" /> Activity & audit trail</div>
            </div>
            {(activity ?? []).length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No activity recorded yet.</div>
            ) : (
              <ol className="px-5 py-4 space-y-0 relative">
                {(activity ?? []).map((a, i) => (
                  <li key={a.id} className="relative pl-6 pb-4 last:pb-0">
                    {i < (activity ?? []).length - 1 && (
                      <span className="absolute left-[7px] top-4 bottom-0 w-px bg-border" aria-hidden />
                    )}
                    <span className={`absolute left-0 top-1 size-3.5 rounded-full border-2 border-card ${actionDot(a.action)}`} aria-hidden />
                    <div className="text-sm">{actionLabel(a.action, (a.metadata ?? {}) as Record<string, unknown>)}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      {/* Void confirmation */}
      <Can perm="billing.void">
        <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive"><Ban className="size-4" /> Void invoice</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Voiding {inv.invoice_number} is permanent. The record stays for audit purposes but stops counting toward revenue.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="void-reason" className="text-xs font-medium text-foreground/80">Reason *</label>
              <input id="void-reason" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Billing error, duplicate…" className={field} />
            </div>
            <DialogFooter>
              <button className="btn btn-secondary" onClick={() => setVoidOpen(false)}>Cancel</button>
              <button
                className="btn bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!voidReason.trim() || voidInv.isPending}
                onClick={async () => {
                  await voidInv.mutateAsync({ id: inv.id, reason: voidReason.trim() });
                  setVoidOpen(false);
                }}
              >
                {voidInv.isPending && <Loader2 className="size-4 animate-spin" />} Void invoice
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Can>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

function actionDot(action: string) {
  if (action === "invoice.payment") return "bg-success";
  if (action === "invoice.void") return "bg-destructive";
  if (action === "invoice.send") return "bg-primary";
  return "bg-muted-foreground";
}

function actionLabel(action: string, meta: Record<string, unknown>) {
  switch (action) {
    case "invoice.create": return <>Invoice created{meta.items ? ` with ${meta.items} item(s)` : ""}</>;
    case "invoice.send": return <>Invoice sent to patient</>;
    case "invoice.mark_pending": return <>Marked as pending</>;
    case "invoice.payment": return <>Payment of <b>{money(Number(meta.amount ?? 0))}</b> recorded ({String(meta.method ?? "")})</>;
    case "invoice.void": return <>Invoice voided{meta.reason ? ` — ${String(meta.reason)}` : ""}</>;
    case "invoice.item_add": return <>Line item added: {String(meta.description ?? "")}</>;
    case "invoice.item_remove": return <>Line item removed</>;
    case "invoice.update": return <>Invoice updated</>;
    default: return <>{action}</>;
  }
}

export default InvoiceDetailPage;
