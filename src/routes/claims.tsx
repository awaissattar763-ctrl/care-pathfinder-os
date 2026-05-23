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
  Approved: "bg-success/15 text-success",
  "In review": "bg-warning/15 text-warning",
  Submitted: "bg-primary/15 text-primary",
  Denied: "bg-destructive/15 text-destructive",
};

function ClaimsPage() {
  const totals = [
    { label: "Submitted MTD", value: "$84,210" },
    { label: "Approved MTD", value: "$61,930" },
    { label: "Denial rate", value: "4.2%" },
    { label: "Avg. days to pay", value: "11.4" },
  ];
  return (
    <div>
      <PageHeader eyebrow="Revenue cycle" title="Insurance claims" description="Track submissions, follow up on denials, and forecast cashflow." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {totals.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs text-muted-foreground">{t.label}</div>
            <div className="text-xl font-semibold tracking-tight mt-2">{t.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Receipt className="size-4 text-primary" />
          <div className="font-semibold tracking-tight">Recent claims</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left font-medium px-5 py-3">Claim</th>
              <th className="text-left font-medium px-5 py-3">Patient</th>
              <th className="text-left font-medium px-5 py-3">Payer</th>
              <th className="text-left font-medium px-5 py-3">Amount</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
              <th className="text-left font-medium px-5 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-secondary/40">
                <td className="px-5 py-3.5 font-medium tabular-nums">{c.id}</td>
                <td className="px-5 py-3.5">{c.patient}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{c.payer}</td>
                <td className="px-5 py-3.5 tabular-nums">${c.amount.toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${tone[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}