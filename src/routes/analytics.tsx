import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { AIInsightCard } from "@/components/copilot/AIInsightCard";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Download,
  FileText,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

// ────────────────────────────────────────────────────────────
// Demo data — realistic healthcare ops metrics
// ────────────────────────────────────────────────────────────

const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

const revenueSeries = months.map((m, i) => ({
  month: m,
  revenue: [884, 921, 1024, 1118, 1192, 1264, 1489][i],
  forecast: [890, 940, 1040, 1130, 1210, 1290, 1520][i],
}));

const patientGrowth = months.map((m, i) => ({
  month: m,
  new: [142, 168, 191, 214, 248, 271, 312][i],
  returning: [612, 648, 702, 741, 798, 842, 901][i],
}));

const doctorUtilization = [
  { name: "Dr. Mehta", util: 92, specialty: "Cardiology" },
  { name: "Dr. Park", util: 87, specialty: "Internal Med." },
  { name: "Dr. Alvarez", util: 81, specialty: "Pediatrics" },
  { name: "Dr. Singh", util: 76, specialty: "Dermatology" },
  { name: "Dr. Okafor", util: 71, specialty: "Neurology" },
  { name: "Dr. Reilly", util: 64, specialty: "Family Med." },
];

const conversionFunnel = [
  { stage: "Inquiries", value: 4820 },
  { stage: "Booked", value: 3142 },
  { stage: "Confirmed", value: 2789 },
  { stage: "Attended", value: 2611 },
  { stage: "Follow-up", value: 1428 },
];

const telemedicineAdoption = months.map((m, i) => ({
  month: m,
  inPerson: [612, 598, 624, 631, 642, 658, 671][i],
  virtual: [104, 138, 182, 224, 281, 342, 418][i],
}));

const claimsTrend = months.map((m, i) => ({
  month: m,
  approved: [78, 80, 82, 84, 86, 88, 91][i],
  denied: [9, 8, 8, 7, 6, 5, 4][i],
}));

const payerMix = [
  { name: "Blue Shield", value: 32 },
  { name: "UnitedHealth", value: 24 },
  { name: "Aetna", value: 18 },
  { name: "Medicare", value: 14 },
  { name: "Self-pay", value: 12 },
];

const opsEfficiency = [
  { label: "Avg. wait time", value: "11 min", delta: "−3 min", positive: true },
  { label: "Room turnover", value: "8.4 min", delta: "−1.2 min", positive: true },
  { label: "Documentation lag", value: "2.1 hr", delta: "−18%", positive: true },
  { label: "Staff overtime", value: "4.6%", delta: "+0.4%", positive: false },
];

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// ────────────────────────────────────────────────────────────
// Building blocks
// ────────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  meta,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-6 transition lift-on-hover ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
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

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  positive,
  spark,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  spark: number[];
}) {
  const data = spark.map((v, i) => ({ i, v }));
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 transition lift-on-hover relative overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
            positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
          }`}
        >
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
            <Area
              type="monotone"
              dataKey="v"
              stroke="var(--primary)"
              strokeWidth={1.75}
              fill={`url(#spark-${label})`}
            />
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

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

function AnalyticsPage() {
  return (
    <div className="animate-fade-in-up">
      <PageHeader
        eyebrow="Command Center · Live"
        title="Healthcare analytics"
        description="Executive view of revenue, utilization, conversion, and operational health across the practice."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="size-3.5" /> Last 7 months
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="size-3.5" /> Report
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="size-3.5" /> Export
            </Button>
          </>
        }
      />

      {/* Live KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard
          icon={Activity}
          label="Revenue (MTD)"
          value="$1.49M"
          delta="+8.4%"
          positive
          spark={[88, 96, 102, 118, 124, 131, 149]}
        />
        <KpiCard
          icon={Users}
          label="Active patients"
          value="12,418"
          delta="+5.1%"
          positive
          spark={[754, 816, 893, 955, 1046, 1113, 1213]}
        />
        <KpiCard
          icon={Video}
          label="Telemed adoption"
          value="38.4%"
          delta="+6.2%"
          positive
          spark={[14, 19, 22, 26, 30, 34, 38]}
        />
        <KpiCard
          icon={ShieldCheck}
          label="Claim approval"
          value="91.2%"
          delta="+1.8%"
          positive
          spark={[78, 80, 82, 84, 86, 88, 91]}
        />
      </div>

      {/* AI insights */}
      <div className="mb-6">
        <AIInsightCard
          title="Operational insight"
          summary="Telemedicine adoption grew 6.2% MoM, offsetting a 2.3% dip in walk-ins. Dr. Reilly's panel is 19% under capacity — reallocating 8 weekly slots could lift conversion ~$11.4K/mo."
          suggestions={[
            { label: "View suggested schedule", prompt: "Suggest an optimal weekly schedule reallocating 8 slots from Dr. Reilly." },
            { label: "Email to leadership", prompt: "Draft an executive email summarizing this week's operational insight." },
          ]}
        />
      </div>

      {/* Revenue + Payer mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card
          className="lg:col-span-2"
          title="Revenue trend"
          subtitle="Actual vs. forecast · thousands USD"
          meta="Trailing 7 months"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} width={42} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Payer mix" subtitle="Share of billed revenue" meta="MTD">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={payerMix}
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {payerMix.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2 mt-4">
            {payerMix.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-foreground font-medium">{p.name}</span>
                </span>
                <span className="text-muted-foreground tabular-nums">{p.value}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Patient growth + Telemedicine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Patient growth" subtitle="New vs. returning" meta="Monthly">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientGrowth} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} width={42} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                <Bar dataKey="returning" stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="new" stackId="a" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> New
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "var(--chart-2)" }} /> Returning
            </span>
          </div>
        </Card>

        <Card title="Telemedicine adoption" subtitle="Virtual vs. in-person visits" meta="Monthly">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemedicineAdoption} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="virt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="inp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} width={42} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Area
                  type="monotone"
                  dataKey="inPerson"
                  stroke="var(--primary)"
                  strokeWidth={1.5}
                  fill="url(#inp)"
                />
                <Area
                  type="monotone"
                  dataKey="virtual"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  fill="url(#virt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Doctor utilization + Conversion funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Doctor utilization" subtitle="Booked vs. available hours" meta="This week">
          <ul className="space-y-3.5">
            {doctorUtilization.map((d) => (
              <li key={d.name}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2">
                    <Stethoscope className="size-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{d.name}</span>
                    <span className="text-muted-foreground">· {d.specialty}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">{d.util}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${d.util}%`,
                      background:
                        d.util >= 85
                          ? "var(--warning)"
                          : d.util >= 70
                            ? "var(--gradient-primary)"
                            : "var(--chart-2)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Appointment conversion"
          subtitle="Inquiry → attended funnel"
          meta={`Conv. ${((conversionFunnel[3].value / conversionFunnel[0].value) * 100).toFixed(1)}%`}
        >
          <div className="space-y-2.5">
            {conversionFunnel.map((s, i) => {
              const pct = (s.value / conversionFunnel[0].value) * 100;
              const drop =
                i === 0
                  ? null
                  : (
                      ((conversionFunnel[i - 1].value - s.value) /
                        conversionFunnel[i - 1].value) *
                      100
                    ).toFixed(1);
              return (
                <div key={s.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{s.stage}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {s.value.toLocaleString()}
                      {drop && <span className="ml-2 text-destructive/80">−{drop}%</span>}
                    </span>
                  </div>
                  <div className="h-7 rounded-md bg-secondary/60 overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all"
                      style={{
                        width: `${pct}%`,
                        background: "var(--gradient-primary)",
                        opacity: 1 - i * 0.12,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Claims trend + Ops efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card
          className="lg:col-span-2"
          title="Insurance claim approvals"
          subtitle="Approval and denial rate %"
          meta="Trailing 7 months"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={claimsTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} width={42} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="var(--success)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: "var(--success)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="denied"
                  stroke="var(--destructive)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: "var(--destructive)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-destructive" /> Denied
            </span>
          </div>
        </Card>

        <Card title="Operational efficiency" subtitle="Live operations health" meta={
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" /> Live
          </span>
        }>
          <ul className="divide-y divide-border -my-2">
            {opsEfficiency.map((m) => (
              <li key={m.label} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-lg font-semibold tracking-tight tabular-nums mt-0.5">
                    {m.value}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                    m.positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                  }`}
                >
                  {m.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {m.delta}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
            <HeartPulse className="size-3.5 text-success" />
            All systems nominal · updated 2 min ago
          </div>
        </Card>
      </div>
    </div>
  );
}