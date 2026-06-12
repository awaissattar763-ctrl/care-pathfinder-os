import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, AlertTriangle, RefreshCw, TrendingUp, Users, Layers, Wallet } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid, Legend,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceStatusPill } from "@/components/billing/InvoiceStatusPill";
import {
  useInvoices, billingStats, revenueByMonth, revenueByProvider, revenueByServiceType,
  topPayingPatients, effectiveStatus, balanceDue, money,
} from "@/hooks/billing-queries";

export const Route = createFileRoute("/billing/analytics")({ component: BillingAnalyticsPage });

const PIE_COLORS = ["var(--primary)", "#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#94a3b8"];

function BillingAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useInvoices();

  const stats = useMemo(() => billingStats(data ?? []), [data]);
  const monthly = useMemo(() => revenueByMonth(data ?? [], 12), [data]);
  const byProvider = useMemo(() => revenueByProvider(data ?? []), [data]);
  const byService = useMemo(() => revenueByServiceType(data ?? []), [data]);
  const topPatients = useMemo(() => topPayingPatients(data ?? []), [data]);
  const outstanding = useMemo(
    () =>
      (data ?? [])
        .filter((i) => i.status !== "voided" && i.status !== "draft" && balanceDue(i) > 0)
        .sort((a, b) => balanceDue(b) - balanceDue(a))
        .slice(0, 8),
    [data],
  );

  const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 };

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        eyebrow="Revenue Center"
        title="Revenue analytics"
        description="Collections, provider performance, and outstanding balances."
        actions={<Link to="/billing" className="btn btn-secondary"><ArrowLeft className="size-4" /> Billing</Link>}
      />

      {isError ? (
        <div className="surface p-8 text-center">
          <AlertTriangle className="size-8 mx-auto text-warning mb-3" />
          <h2 className="font-semibold">Couldn't load analytics</h2>
          <button onClick={() => refetch()} className="btn btn-secondary mt-4"><RefreshCw className="size-4" /> Retry</button>
        </div>
      ) : isLoading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="surface p-10 text-center">
          <TrendingUp className="size-8 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-semibold">No billing data yet</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and collect invoices to populate revenue analytics.</p>
          <Link to="/billing" className="btn btn-primary mt-4">Go to billing</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Collections dashboard strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Collected (all time)" value={money(stats.totalRevenue)} icon={Wallet} />
            <Stat label="Outstanding" value={money(stats.outstanding)} icon={Layers} tone={stats.outstanding > 0 ? "text-warning" : ""} />
            <Stat label="Collection rate" value={`${stats.collectionRate.toFixed(1)}%`} icon={TrendingUp} />
            <Stat label="Avg invoice" value={money(stats.avgValue)} icon={Users} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Revenue by month */}
            <section className="surface p-5">
              <div className="section-head__title mb-1">Revenue by month</div>
              <div className="section-head__sub mb-3">Collected vs billed · last 12 months</div>
              <div className="h-64" role="img" aria-label="Monthly revenue chart for the last twelve months">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 6, right: 6, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="rev12" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <ChartTooltip formatter={(v: number, n: string) => [money(v), n === "collected" ? "Collected" : "Billed"]} contentStyle={tooltipStyle} />
                    <Legend formatter={(v) => (v === "collected" ? "Collected" : "Billed")} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="billed" stroke="var(--muted-foreground)" strokeDasharray="4 3" fill="none" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="collected" stroke="var(--primary)" fill="url(#rev12)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Revenue by provider */}
            <section className="surface p-5">
              <div className="section-head__title mb-1">Revenue by provider</div>
              <div className="section-head__sub mb-3">Collected payments attributed to invoicing provider</div>
              {byProvider.length === 0 ? (
                <EmptyMini text="No collected revenue yet." />
              ) : (
                <div className="h-64" role="img" aria-label="Bar chart of revenue per provider">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byProvider.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <ChartTooltip formatter={(v: number) => [money(v), "Collected"]} contentStyle={tooltipStyle} />
                      <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Revenue by service type */}
            <section className="surface p-5">
              <div className="section-head__title mb-1">Revenue by service type</div>
              <div className="section-head__sub mb-3">Collections allocated across line-item categories</div>
              {byService.length === 0 ? (
                <EmptyMini text="No collected revenue yet." />
              ) : (
                <div className="h-64 flex items-center" role="img" aria-label="Pie chart of revenue by service type">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byService} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                        {byService.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Top paying patients */}
            <section className="surface overflow-hidden">
              <div className="section-head">
                <div>
                  <div className="section-head__title">Top paying patients</div>
                  <div className="section-head__sub">By total collected</div>
                </div>
              </div>
              {topPatients.length === 0 ? (
                <EmptyMini text="No payments recorded yet." pad />
              ) : (
                <ul className="divide-y divide-border">
                  {topPatients.map((p, i) => (
                    <li key={p.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                      <span className="size-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.invoices} invoice{p.invoices === 1 ? "" : "s"}{p.mrn ? ` · MRN ${p.mrn}` : ""}
                        </div>
                      </div>
                      {p.outstanding > 0 && <span className="text-[11px] text-warning tabular-nums">{money(p.outstanding)} due</span>}
                      <span className="font-semibold tabular-nums">{money(p.paid)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Outstanding balances */}
          <section className="surface overflow-hidden">
            <div className="section-head">
              <div>
                <div className="section-head__title">Outstanding balances</div>
                <div className="section-head__sub">Largest unpaid invoices first</div>
              </div>
            </div>
            {outstanding.length === 0 ? (
              <EmptyMini text="Nothing outstanding — all caught up." pad />
            ) : (
              <ul className="divide-y divide-border">
                {outstanding.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      to="/billing/$invoiceId"
                      params={{ invoiceId: inv.id }}
                      className="px-5 py-3 flex items-center gap-3 text-sm hover:bg-primary/[0.04] transition-colors"
                    >
                      <span className="font-medium">{inv.invoice_number}</span>
                      <span className="text-muted-foreground flex-1 truncate">{inv.patient?.name ?? "—"}</span>
                      <span className="hidden sm:inline text-xs text-muted-foreground">
                        Due {new Date(inv.due_date).toLocaleDateString()}
                      </span>
                      <InvoiceStatusPill invoice={inv} />
                      <span className={`font-semibold tabular-nums ${effectiveStatus(inv) === "overdue" ? "text-destructive" : ""}`}>
                        {money(balanceDue(inv))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone = "" }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>; tone?: string;
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{label}</div>
        <Icon className={`size-4 text-primary ${tone}`} aria-hidden />
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function EmptyMini({ text, pad = false }: { text: string; pad?: boolean }) {
  return <div className={`text-sm text-muted-foreground text-center ${pad ? "p-6" : "h-64 flex items-center justify-center"}`}>{text}</div>;
}
