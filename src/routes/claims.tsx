import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Receipt } from "lucide-react";
import { useClaims, useUpdateClaimStatus } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { CLAIM_STATUSES } from "@/lib/constants";

export const Route = createFileRoute("/claims")({ component: ClaimsPage });

const tone: Record<string, string> = {
  Approved: "pill pill--success",
  Paid: "pill pill--success",
  "In review": "pill pill--warning",
  Pending: "pill pill--warning",
  Appealed: "pill pill--warning",
  Submitted: "pill pill--info",
  Denied: "pill pill--danger",
};

const statusOptions = CLAIM_STATUSES;

function ClaimsPage() {
  const { data: claims, isLoading } = useClaims();
  const updateStatus = useUpdateClaimStatus();

  const submittedMTD = (claims ?? []).reduce((s, c) => s + Number(c.amount || 0), 0);
  const approvedMTD = (claims ?? []).filter((c) => c.status === "Approved").reduce((s, c) => s + Number(c.amount || 0), 0);
  const denialRate = claims && claims.length > 0
    ? ((claims.filter((c) => c.status === "Denied").length / claims.length) * 100).toFixed(1)
    : "0.0";

  const totals = [
    { label: "Submitted MTD", value: `$${submittedMTD.toLocaleString()}`, delta: `${claims?.length ?? 0} claims` },
    { label: "Approved MTD", value: `$${approvedMTD.toLocaleString()}`, delta: submittedMTD ? `${Math.round((approvedMTD / submittedMTD) * 100)}% approval` : "—" },
    { label: "Denial rate", value: `${denialRate}%`, delta: "Target: <5%" },
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
          <div key={t.label} className="surface p-5 lift-on-hover animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
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
              <div className="section-head__sub">Last 30 days · {claims?.length ?? 0} submitted</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm">Filter</button>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !claims || claims.length === 0 ? (
          <EmptyState icon={Receipt} title="No claims submitted" description="Claims will appear here once you submit them to payers." />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Claim</th><th>Patient</th><th>Payer</th><th className="text-right">Amount</th><th>Status</th><th>Submitted</th></tr>
            </thead>
            <tbody>
              {claims.map((c, i) => (
                <tr key={c.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="font-medium tabular-nums">{c.claim_number}</td>
                  <td>{c.patient?.name ?? "—"}</td>
                  <td className="text-muted-foreground">{c.payer}</td>
                  <td className="tabular-nums text-right">${Number(c.amount).toLocaleString()}</td>
                  <td>
                    <select
                      value={c.status}
                      onChange={(e) => updateStatus.mutate({ id: c.id, status: e.target.value })}
                      className={`${tone[c.status] ?? "pill pill--neutral"} cursor-pointer border-0 outline-none`}
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="text-muted-foreground">{new Date(c.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
