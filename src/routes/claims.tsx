import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/claims")({ component: ClaimsPage });

const claims = [
  { id: "A-3209", patient: "Maya Chen", payer: "Blue Shield", amount: 420, status: "Approved", date: "May 21" },
  { id: "A-3208", patient: "Daniel Ortiz", payer: "Aetna", amount: 1180, status: "In review", date: "May 20" },
  { id: "A-3207", patient: "Priya Anand", payer: "UnitedHealth", amount: 295, status: "Submitted", date: "May 19" },
  { id: "A-3206", patient: "Sam Whitaker", payer: "Kaiser", amount: 540, status: "Denied", date: "May 17" },
  { id: "A-3205", patient: "Rosa Lin", payer: "Medicare", amount: 2840, status: "Approved", date: "May 14" },
];

const tone: Record<string, string> = {
  Approved: "pill pill--success",
  "In review": "pill pill--warning",
  Submitted: "pill pill--info",
  Denied: "pill pill--danger",
};

function ClaimsPage() {
  const totals = [
    { label: "Submitted MTD", value: "$84,210", delta: "+6.1% vs Apr" },
    { label: "Approved MTD", value: "$61,930", delta: "73.5% approval" },
    { label: "Denial rate", value: "4.2%", delta: "-0.8 pts" },
    { label: "Avg. days to pay", value: "11.4", delta: "Target: <14" },
  ];
  return (
    <div>
      <PageHeader
        eyebrow="Revenue cycle"
        title="Insurance claims"
        description="Track submissions, follow up on denials, and forecast cashflow."
        actions={
          <>
            <button className="btn btn-secondary">Export 837P</button>
            <button className="btn btn-primary">New claim</button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {totals.map((t, i) => (
          <div
            key={t.label}
            className="surface p-5 lift-on-hover animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="label-eyebrow">{t.label}</div>
            <div className="text-2xl font-semibold tracking-tight mt-2 tabular-nums">{t.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{t.delta}</div>
          </div>
        ))}
      </div>

      <div className="surface">
        <div className="section-head">
          <div className="flex items-center gap-2.5">
            <Receipt className="size-4 text-primary" aria-hidden />
            <div>
              <div className="section-head__title">Recent claims</div>
              <div className="section-head__sub">Last 30 days · {claims.length} submitted</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm">Filter</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim</th>
              <th>Patient</th>
              <th>Payer</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c, i) => (
              <tr key={c.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="font-medium tabular-nums">{c.id}</td>
                <td>{c.patient}</td>
                <td className="text-muted-foreground">{c.payer}</td>
                <td className="tabular-nums text-right">${c.amount.toLocaleString()}</td>
                <td>
                  <span className={tone[c.status]}>{c.status}</span>
                </td>
                <td className="text-muted-foreground">{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}