import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/skeletons";
import { Wallet, DollarSign, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/format";
import { useInvoices, useBillingSummary, useCreateInvoice } from "@/hooks/queries/billing";
import { usePatients } from "@/hooks/queries";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
  head: () => ({ meta: [{ title: "Billing — HealthOS" }] }),
});

const tone: Record<InvoiceStatus, string> = {
  Draft: "pill pill--neutral",
  Sent: "pill pill--info",
  Paid: "pill pill--success",
  Overdue: "pill pill--danger",
  Refunded: "pill pill--warning",
  Cancelled: "pill pill--neutral",
};

function BillingPage() {
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const { data: summary } = useBillingSummary();
  const { data: invoices, isLoading } = useInvoices(filter === "all" ? undefined : { status: filter });

  const totals = [
    { label: "Revenue MTD", value: formatCurrency(summary?.revenueMTD ?? 0), delta: `${summary?.invoiceCount ?? 0} invoices`, icon: TrendingUp },
    { label: "Collections MTD", value: formatCurrency(summary?.collectionsMTD ?? 0), delta: "Cash + Card + Online", icon: DollarSign },
    { label: "Insurance recovery", value: formatCurrency(summary?.insuranceRecoveryMTD ?? 0), delta: "Paid by payers MTD", icon: Wallet },
    { label: "Outstanding", value: formatCurrency(summary?.outstandingTotal ?? 0), delta: "Sent + overdue", icon: AlertCircle },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Revenue cycle"
        title="Billing"
        description="Invoices, payments, refunds, and outstanding balances across all patients."
        actions={
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus className="size-4" /> New invoice
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {totals.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="surface p-5 lift-on-hover animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center justify-between">
                <div className="label-eyebrow">{t.label}</div>
                <Icon className="size-4 text-primary/70" aria-hidden />
              </div>
              <div className="text-2xl font-semibold tracking-tight mt-2 tabular-nums">{t.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{t.delta}</div>
            </div>
          );
        })}
      </div>

      <div className="surface">
        <div className="section-head">
          <div className="flex items-center gap-2.5">
            <Wallet className="size-4 text-primary" aria-hidden />
            <div>
              <div className="section-head__title">Invoices</div>
              <div className="section-head__sub">{invoices?.length ?? 0} shown</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
            {INVOICE_STATUSES.map((s) => (
              <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{s}</FilterChip>
            ))}
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !invoices || invoices.length === 0 ? (
          <EmptyState icon={Wallet} title="No invoices" description="Invoices will appear here once you bill patients." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th className="text-right">Total</th>
                <th className="text-right">Balance</th>
                <th>Status</th>
                <th>Issued</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 20}ms` }}>
                  <td className="font-medium tabular-nums">{inv.invoice_number}</td>
                  <td>{inv.patient?.name ?? "—"}<div className="text-[11px] text-muted-foreground">{inv.patient?.mrn}</div></td>
                  <td className="tabular-nums text-right">{formatCurrency(Number(inv.total))}</td>
                  <td className="tabular-nums text-right">{formatCurrency(Number(inv.balance_due))}</td>
                  <td><span className={tone[inv.status as InvoiceStatus] ?? "pill pill--neutral"}>{inv.status}</span></td>
                  <td className="text-muted-foreground">{formatDate(inv.issued_at)}</td>
                  <td>
                    <Link to="/billing/$invoiceId" params={{ invoiceId: inv.id }} className="text-primary text-xs font-medium hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateInvoiceDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CreateInvoiceDialog({ onClose }: { onClose: () => void }) {
  const { data: patients } = usePatients();
  const create = useCreateInvoice();
  const navigate = Route.useNavigate();
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");

  const patientOpts = useMemo(() => patients ?? [], [patients]);
  const field = "w-full h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    const inv = await create.mutateAsync({
      patient_id: patientId,
      notes: notes || null,
      due_date: dueDate || null,
      status: "Draft",
    });
    onClose();
    navigate({ to: "/billing/$invoiceId", params: { invoiceId: inv.id } });
  }

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">New invoice</h2>
        <div>
          <label className="text-xs font-medium text-foreground/80">Patient</label>
          <select required value={patientId} onChange={(e) => setPatientId(e.target.value)} className={field}>
            <option value="">Select patient…</option>
            {patientOpts.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/80">Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/80">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={create.isPending} className="btn btn-primary">Create</button>
        </div>
      </form>
    </div>
  );
}