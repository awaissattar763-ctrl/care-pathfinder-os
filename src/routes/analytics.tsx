import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { AIInsightCard } from "@/components/copilot/AIInsightCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, RefreshCw,
  ShieldCheck, Users, Video,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useAppointments, useClaims, usePatients } from "@/hooks/queries";
import { useInvoices, money } from "@/hooks/billing-queries";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const MONTHS_BACK = 7;

// ────────────────────────────────────────────────────────────
// Building blocks (visual structure unchanged)
// ────────────────────────────────────────────────────────────

function Card({ title, subtitle, meta, children, className = "" }: {
  title?: string; subtitle?: string; meta?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 transition lift-on-hover ${className}`} style={{ boxShadow: "var(--shadow-card)" }}>
      {(title || meta) && (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title && <div className="font-semibold tracking-tight text-foreground">{title}</div>}
            {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
          </div>
          {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, delta, positive, spark }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string;
  delta: string; positive: boolean; spark: number[];
}) {
  const data = spark.map((v, i) => ({ i, v }));
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition lift-on-hover relative overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"}`}>
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {delta}
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-3 tabular-nums">{value}</div>
      <div className="h-10 -mx-1 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={1.75} fill={`url(#spark-${label})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const axisProps = {
  stroke: "var(--border)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  padding: "8px 10px",
  boxShadow: "var(--shadow-card)",
  color: "var(--popover-foreground)",
};

function EmptyMini({ text }: { text: string }) {
  return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{text}</div>;
}

function pctDelta(cur: number, prev: number): { delta: string; positive: boolean } {
  if (prev <= 0) return { delta: cur > 0 ? "new" : "—", positive: cur >= 0 };
  const d = ((cur - prev) / prev) * 100;
  return { delta: `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`, positive: d >= 0 };
}

// ────────────────────────────────────────────────────────────
// Real-data computation (invoices · claims · appointments · patients)
// ────────────────────────────────────────────────────────────

function monthBuckets(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - idx), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString(undefined, { month: "short" }) };
  });
}
const keyOf = (d: string | Date) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}`; };

function AnalyticsPage() {
  const invoicesQ = useInvoices();
  const claimsQ = useClaims();
  const apptsQ = useAppointments();
  const patientsQ = usePatients();

  const isLoading = invoicesQ.isLoading || claimsQ.isLoading || apptsQ.isLoading || patientsQ.isLoading;
  const isError = invoicesQ.isError || claimsQ.isError || apptsQ.isError || patientsQ.isError;

  const d = useMemo(() => {
    const invoices = invoicesQ.data ?? [];
    const claims = (claimsQ.data ?? []) as Array<{ amount: number; payer: string; status: string; submitted_at: string }>;
    const appts = (apptsQ.data ?? []) as Array<{ scheduled_at: string; visit_type: string; status: string; provider?: { name: string } | null; created_at?: string }>;
    const patients = (patientsQ.data ?? []) as Array<{ created_at?: string }>;
    const buckets = monthBuckets(MONTHS_BACK);
    const bIdx = new Map(buckets.map((b, i) => [b.key, i]));

    // Revenue: collected (payments) vs billed (issued invoices) per month
    const revenueSeries = buckets.map((b) => ({ month: b.month, collected: 0, billed: 0 }));
    for (const inv of invoices) {
      if (inv.status === "voided") continue;
      const bi = bIdx.get(keyOf(inv.issue_date));
      if (bi !== undefined && inv.status !== "draft") revenueSeries[bi].billed += Number(inv.total);
      for (const p of inv.payments) {
        const pi = bIdx.get(keyOf(p.paid_at));
        if (pi !== undefined) revenueSeries[pi].collected += Number(p.amount);
      }
    }

    // Payer mix from claims (amount share)
    const payerMap = new Map<string, number>();
    for (const c of claims) payerMap.set(c.payer || "Self-pay", (payerMap.get(c.payer || "Self-pay") ?? 0) + Number(c.amount || 0));
    const payerMix = [...payerMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Patient growth: new patients per month + appointments per month
    const patientGrowth = buckets.map((b) => ({ month: b.month, newPatients: 0, visits: 0 }));
    for (const p of patients) { const i = p.created_at ? bIdx.get(keyOf(p.created_at)) : undefined; if (i !== undefined) patientGrowth[i].newPatients++; }
    for (const a of appts) { const i = bIdx.get(keyOf(a.scheduled_at)); if (i !== undefined) patientGrowth[i].visits++; }

    // Telemedicine adoption per month
    const isVirtual = (v: string) => v === "telemedicine" || v === "video" || v === "virtual";
    const telemed = buckets.map((b) => ({ month: b.month, inPerson: 0, virtual: 0 }));
    for (const a of appts) {
      const i = bIdx.get(keyOf(a.scheduled_at));
      if (i === undefined) continue;
      if (isVirtual(a.visit_type)) telemed[i].virtual++; else telemed[i].inPerson++;
    }

    // Provider activity (appointments per provider, top 6)
    const provMap = new Map<string, number>();
    for (const a of appts) provMap.set(a.provider?.name ?? "Unassigned", (provMap.get(a.provider?.name ?? "Unassigned") ?? 0) + 1);
    const provTop = [...provMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    const provMax = Math.max(1, ...provTop.map((p) => p.count));
    const providerActivity = provTop.map((p) => ({ ...p, util: Math.round((p.count / provMax) * 100) }));

    // Appointment pipeline (status breakdown)
    const statusMap = new Map<string, number>();
    for (const a of appts) statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1);
    const pipeline = [...statusMap.entries()].map(([stage, value]) => ({ stage, value })).sort((a, b) => b.value - a.value);

    // Claims trend per month (approved vs denied counts)
    const claimsTrend = buckets.map((b) => ({ month: b.month, approved: 0, denied: 0 }));
    for (const c of claims) {
      const i = bIdx.get(keyOf(c.submitted_at));
      if (i === undefined) continue;
      if (c.status === "approved" || c.status === "paid") claimsTrend[i].approved++;
      else if (c.status === "denied") claimsTrend[i].denied++;
    }

    // KPIs (current vs previous month, all real)
    const cur = MONTHS_BACK - 1, prev = MONTHS_BACK - 2;
    const revenueMTD = revenueSeries[cur].collected;
    const revDelta = pctDelta(revenueMTD, revenueSeries[prev].collected);
    const apptsThisMonth = telemed[cur].inPerson + telemed[cur].virtual;
    const apptsPrev = telemed[prev].inPerson + telemed[prev].virtual;
    const teleShare = apptsThisMonth > 0 ? (telemed[cur].virtual / apptsThisMonth) * 100 : 0;
    const teleSharePrev = apptsPrev > 0 ? (telemed[prev].virtual / apptsPrev) * 100 : 0;
    const decided = claims.filter((c) => ["approved", "paid", "denied"].includes(c.status));
    const approvalRate = decided.length > 0 ? (decided.filter((c) => c.status !== "denied").length / decided.length) * 100 : 0;
    const cancelled = appts.filter((a) => a.status === "cancelled").length;
    const cancelRate = appts.length > 0 ? (cancelled / appts.length) * 100 : 0;
    const pendingClaims = claims.filter((c) => !["approved", "paid", "denied"].includes(c.status)).length;
    const unpaid = invoices.filter((i) => !["paid", "voided", "draft"].includes(i.status)).length;

    return {
      revenueSeries, payerMix, patientGrowth, telemed, providerActivity, pipeline, claimsTrend,
      kpis: {
        revenueMTD, revDelta,
        patientsTotal: patients.length,
        patientsDelta: pctDelta(patientGrowth[cur].newPatients, patientGrowth[prev].newPatients),
        teleShare, teleDelta: pctDelta(teleShare, teleSharePrev),
        approvalRate, decidedCount: decided.length,
      },
      ops: { apptsThisMonth, cancelRate, pendingClaims, unpaid },
      sparks: {
        revenue: revenueSeries.map((r) => r.collected),
        patients: patientGrowth.map((p) => p.newPatients),
        tele: telemed.map((t) => (t.inPerson + t.virtual > 0 ? (t.virtual / (t.inPerson + t.virtual)) * 100 : 0)),
        claims: claimsTrend.map((c) => c.approved),
      },
      hasAnyData: invoices.length + claims.length + appts.length > 0,
    };
  }, [invoicesQ.data, claimsQ.data, apptsQ.data, patientsQ.data]);

  if (isError) {
    return (
      <div className="animate-fade-in-up">
        <PageHeader eyebrow="Command Center" title="Healthcare analytics" description="Executive view of revenue, utilization, and operational health across the practice." />
        <div className="rounded-xl border border-border bg-card p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <AlertTriangle className="size-8 mx-auto text-warning mb-3" />
          <h2 className="font-semibold">Couldn't load analytics data</h2>
          <p className="text-sm text-muted-foreground mt-1">Check your connection and try again.</p>
          <button onClick={() => { invoicesQ.refetch(); claimsQ.refetch(); apptsQ.refetch(); patientsQ.refetch(); }} className="btn btn-secondary mt-4">
            <RefreshCw className="size-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        eyebrow="Command Center · Live data"
        title="Healthcare analytics"
        description="Executive view computed from billing, claims, and appointment records."
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80" />)}</div>
        </div>
      ) : (
        <>
          {/* Live KPI row — all computed from records */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard icon={Activity} label="Revenue (MTD)" value={money(d.kpis.revenueMTD)} delta={d.kpis.revDelta.delta} positive={d.kpis.revDelta.positive} spark={d.sparks.revenue} />
            <KpiCard icon={Users} label="Patients on record" value={d.kpis.patientsTotal.toLocaleString()} delta={d.kpis.patientsDelta.delta} positive={d.kpis.patientsDelta.positive} spark={d.sparks.patients} />
            <KpiCard icon={Video} label="Telemed share (MTD)" value={`${d.kpis.teleShare.toFixed(1)}%`} delta={d.kpis.teleDelta.delta} positive={d.kpis.teleDelta.positive} spark={d.sparks.tele} />
            <KpiCard icon={ShieldCheck} label="Claim approval" value={d.kpis.decidedCount > 0 ? `${d.kpis.approvalRate.toFixed(1)}%` : "—"} delta={`${d.kpis.decidedCount} decided`} positive={d.kpis.approvalRate >= 80} spark={d.sparks.claims} />
          </div>

          {/* AI insight — summary computed from real numbers */}
          <div className="mb-6">
            <AIInsightCard
              title="Operational snapshot"
              summary={`This month: ${money(d.kpis.revenueMTD)} collected, ${d.ops.apptsThisMonth} appointments (${d.kpis.teleShare.toFixed(0)}% virtual), ${d.ops.unpaid} unpaid invoice(s) and ${d.ops.pendingClaims} claim(s) pending. Ask the Copilot to dig into any of these.`}
              suggestions={[
                { label: "Analyze collections", prompt: "Analyze our current outstanding invoices and suggest a collections follow-up plan." },
                { label: "Review claim denials", prompt: "Review common reasons insurance claims get denied and how to reduce our denial rate." },
              ]}
            />
          </div>

          {/* Revenue + Payer mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card className="lg:col-span-2" title="Revenue trend" subtitle="Collected vs billed · USD" meta={`Trailing ${MONTHS_BACK} months`}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.revenueSeries} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [money(v), n === "collected" ? "Collected" : "Billed"]} />
                    <Area type="monotone" dataKey="billed" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 3" fill="none" />
                    <Area type="monotone" dataKey="collected" stroke="var(--primary)" strokeWidth={2} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Payer mix" subtitle="Share of billed claim value" meta="All time">
              {d.payerMix.length === 0 ? (
                <EmptyMini text="No claims submitted yet." />
              ) : (
                <div className="h-72 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={d.payerMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3} strokeWidth={0}>
                        {d.payerMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Growth + Telemedicine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card title="Patient growth" subtitle="New patients vs appointment volume" meta="Monthly">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.patientGrowth} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [v, n === "newPatients" ? "New patients" : "Appointments"]} />
                    <Bar dataKey="visits" stackId="a" fill="var(--chart-2)" />
                    <Bar dataKey="newPatients" stackId="a" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Telemedicine adoption" subtitle="Virtual vs in-person visits" meta="Monthly">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.telemed} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="inPerson" name="In-person" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="virtual" name="Virtual" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Provider activity + Appointment pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card title="Provider activity" subtitle="Appointment volume relative to busiest provider" meta="All time">
              {d.providerActivity.length === 0 ? (
                <EmptyMini text="No appointments yet." />
              ) : (
                <div className="space-y-3">
                  {d.providerActivity.map((p) => (
                    <div key={p.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{p.count} appt{p.count === 1 ? "" : "s"}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.util}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card title="Appointment pipeline" subtitle="Current status breakdown" meta="All time">
              {d.pipeline.length === 0 ? (
                <EmptyMini text="No appointments yet." />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.pipeline} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" {...axisProps} allowDecimals={false} />
                      <YAxis type="category" dataKey="stage" width={92} {...axisProps} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Claims trend */}
          <Card title="Claims outcomes" subtitle="Approved vs denied per month" meta={`Trailing ${MONTHS_BACK} months`} className="mb-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.claimsTrend} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="approved" name="Approved" fill="var(--success, var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="denied" name="Denied" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Ops strip — real operational metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Appointments (MTD)", value: String(d.ops.apptsThisMonth) },
              { label: "Cancellation rate", value: `${d.ops.cancelRate.toFixed(1)}%` },
              { label: "Pending claims", value: String(d.ops.pendingClaims) },
              { label: "Unpaid invoices", value: String(d.ops.unpaid) },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className="text-xl font-semibold tracking-tight mt-1 tabular-nums">{m.value}</div>
              </div>
            ))}
          </div>

          {!d.hasAnyData && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              Charts will populate as appointments, claims, and invoices are recorded — no sample data is shown.
            </div>
          )}
        </>
      )}
    </div>
  );
}
