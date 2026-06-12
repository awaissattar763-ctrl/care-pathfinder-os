import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Receipt, Plus, TrendingUp, Wallet, CalendarCheck, AlertTriangle, Percent,
  FileText, ArrowUpRight, Search, BarChart3, RefreshCw,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { GuardedAction } from "@/components/rbac/Can";
import { NewInvoiceDialog } from "@/components/billing/NewInvoiceDialog";
import { InvoiceStatusPill } from "@/components/billing/InvoiceStatusPill";
import {
  useInvoices, billingStats, revenueByMonth, effectiveStatus, balanceDue, money,
  STATUS_LABELS, type InvoiceWithRefs,
} from "@/hooks/billing-queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/billing/")({ component: BillingPage });

const TABS = ["all", "draft", "sent", "pending", "partially_paid", "overdue", "paid", "voided"] as const;

function BillingPage() {
  const { data, isLoading, isError, refetch } = useInvoices();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => billingStats(data ?? []), [data]);
  const trend = useMemo(() => revenueByMonth(data ?? [], 6), [data]);

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (tab !== "all") list = list.filter((i) => effectiveStatus(i) === tab);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(q) ||
          (i.patient?.name ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, tab, search]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        eyebrow="Revenue Center"
        title="Billing"
        description="Invoices, payments, and collections across the practice."
        actions={
          <>
            <Link to="/billing/analytics" className="btn btn-secondary">
              <BarChart3 className="size-4" /> Analytics
            </Link>
            <GuardedAction perm="billing.write" action="billing.create_invoice" label="New invoice" icon={<Plus className="size-4" />}>
              <NewInvoiceDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> New invoice</button>} />
            </GuardedAction>
          </>
        }
      />

      {isError ? (
        <div className="surface p-8 text-center">
          <AlertTriangle className="size-8 mx-auto text-warning mb-3" />
          <h2 className="font-semibold">Couldn't load billing data</h2>
          <p className="text-sm text-muted-foreground mt-1">Check your connection and try again.</p>
          <button onClick={() => refetch()} className="btn btn-secondary mt-4"><RefreshCw className="size-4" /> Retry</button>
        </div>
      ) : (
        <>
          {/* KPI grid — 7 metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 mb-4">
            <Kpi label="Total revenue" value={money(stats.totalRevenue)} icon={Wallet} loading={isLoading} />
            <Kpi label="Outstanding" value={money(stats.outstanding)} icon={FileText} tone={stats.outstanding > 0 ? "text-warning" : ""} loading={isLoading} />
            <Kpi label="Paid this month" value={money(stats.paidThisMonth)} icon={CalendarCheck} tone="text-success" loading={isLoading} />
            <Kpi label="Overdue invoices" value={String(stats.overdueCount)} sub={money(stats.overdueAmount)} icon={AlertTriangle} tone={stats.overdueCount > 0 ? "text-destructive" : ""} loading={isLoading} />
            <Kpi label="Collection rate" value={`${stats.collectionRate.toFixed(1)}%`} icon={Percent} loading={isLoading} />
            <Kpi label="Avg invoice value" value={money(stats.avgValue)} icon={TrendingUp} loading={isLoading} />
            <Kpi label="Active invoices" value={String(stats.invoiceCount)} icon={Receipt} loading={isLoading} />
          </div>

          {/* Revenue trend */}
          <div className="surface p-5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="section-head__title">Revenue trend</div>
                <div className="section-head__sub">Collected vs billed · last 6 months</div>
              </div>
              <Link to="/billing/analytics" className="btn btn-ghost btn-sm">Full analytics <ArrowUpRight className="size-3.5" /></Link>
            </div>
            {isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <div className="h-44" role="img" aria-label="Area chart of collected and billed revenue over the last six months">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <ChartTooltip
                      formatter={(v: number, name: string) => [money(v), name === "collected" ? "Collected" : "Billed"]}
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="billed" stroke="var(--muted-foreground)" strokeDasharray="4 3" fill="none" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="collected" stroke="var(--primary)" fill="url(#rev)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Invoice queue */}
          <div className="surface overflow-hidden">
            <div className="section-head flex-wrap gap-3">
              <div>
                <div className="section-head__title">Invoices</div>
                <div className="section-head__sub">{filtered.length} of {(data ?? []).length}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search invoice or patient…"
                    aria-label="Search invoices"
                    className="h-8 pl-8 pr-3 rounded-lg bg-secondary text-xs outline-none focus:ring-2 focus:ring-ring/40 w-48"
                  />
                </div>
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 overflow-x-auto">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn(
                        "px-2.5 h-7 rounded-md text-[11px] font-medium transition whitespace-nowrap",
                        tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t === "all" ? "All" : STATUS_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={tab === "all" && !search ? "No invoices yet" : "No matching invoices"}
                description={tab === "all" && !search ? "Create the first invoice to start tracking revenue." : "Try a different filter or search term."}
                action={
                  tab === "all" && !search ? (
                    <GuardedAction perm="billing.write" action="billing.create_invoice" label="New invoice" icon={<Plus className="size-4" />}>
                      <NewInvoiceDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> New invoice</button>} />
                    </GuardedAction>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((inv, i) => <InvoiceRow key={inv.id} inv={inv} delay={i * 25} />)}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InvoiceRow({ inv, delay }: { inv: InvoiceWithRefs; delay: number }) {
  const due = balanceDue(inv);
  return (
    <li className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <Link
        to="/billing/$invoiceId"
        params={{ invoiceId: inv.id }}
        className="px-5 py-4 flex items-center gap-4 hover:bg-primary/[0.04] transition-colors"
      >
        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden>
          <Receipt className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{inv.invoice_number}</span>
            <span className="text-xs text-muted-foreground truncate">{inv.patient?.name ?? "Unassigned"}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Issued {new Date(inv.issue_date).toLocaleDateString()} · Due {new Date(inv.due_date).toLocaleDateString()}
            {inv.items.length > 0 && ` · ${inv.items.length} item${inv.items.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold tabular-nums">{money(Number(inv.total))}</span>
          {due > 0 && inv.status !== "voided" && inv.status !== "draft" && (
            <span className="text-[11px] text-warning tabular-nums">{money(due)} due</span>
          )}
        </div>
        <InvoiceStatusPill invoice={inv} />
        <ArrowUpRight className="size-4 text-muted-foreground shrink-0" aria-hidden />
      </Link>
    </li>
  );
}

function Kpi({ label, value, sub, icon: Icon, tone = "", loading }: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; tone?: string; loading?: boolean;
}) {
  return (
    <div className="surface p-4 lift-on-hover">
      <div className="flex items-center justify-between gap-2">
        <div className="label-eyebrow truncate">{label}</div>
        <Icon className={cn("size-4 shrink-0 text-primary", tone)} aria-hidden />
      </div>
      {loading ? (
        <Skeleton className="h-7 w-20 mt-2" />
      ) : (
        <>
          <div className="mt-2 text-lg font-semibold tracking-tight tabular-nums truncate">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground tabular-nums">{sub}</div>}
        </>
      )}
    </div>
  );
}
