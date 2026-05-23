import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const revenue = [88, 96, 102, 118, 124, 131, 149]; // k
const max = Math.max(...revenue);

function AnalyticsPage() {
  const stats = [
    { label: "Revenue (MTD)", value: "$148,920", delta: "+8.4% vs Apr" },
    { label: "Visits (MTD)", value: "612", delta: "+5.1%" },
    { label: "Avg. revenue / visit", value: "$243", delta: "+3.2%" },
    { label: "No-show rate", value: "4.8%", delta: "-1.1%" },
  ];
  return (
    <div>
      <PageHeader eyebrow="Last 7 months" title="Revenue analytics" description="Practice performance, payer mix, and cashflow." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold tracking-tight mt-2">{s.value}</div>
            <div className="text-xs text-success mt-1">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold tracking-tight">Monthly revenue</div>
              <div className="text-xs text-muted-foreground">In thousands USD</div>
            </div>
            <div className="text-xs text-muted-foreground">Trailing 7 months</div>
          </div>
          <div className="h-64 flex items-end gap-3">
            {revenue.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-md transition" style={{ height: `${(v / max) * 100}%`, background: "var(--gradient-primary)", boxShadow: i === revenue.length - 1 ? "var(--shadow-glow)" : undefined }} />
                <div className="text-[11px] text-muted-foreground">{months[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="font-semibold tracking-tight mb-4">Payer mix</div>
          <ul className="space-y-3 text-sm">
            {[
              ["Blue Shield", 32],
              ["UnitedHealth", 24],
              ["Aetna", 18],
              ["Medicare", 14],
              ["Self-pay", 12],
            ].map(([label, pct]) => (
              <li key={label as string}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-muted-foreground tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}