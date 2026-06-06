import { createFileRoute } from "@tanstack/react-router";
import { useMyPrescriptions } from "@/hooks/portal-queries";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/portal/prescriptions")({ component: PortalRx });

function PortalRx() {
  const { data, isLoading } = useMyPrescriptions();
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><FileText className="size-5 text-primary" /> My prescriptions</h1>
      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {data && data.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No prescriptions on file.</div>
      )}
      <ul className="space-y-2">
        {(data ?? []).map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{r.drug}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.sig}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-foreground">{r.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div><span className="text-foreground/70">Rx #</span> {r.rx_number}</div>
              <div><span className="text-foreground/70">Refills</span> {r.refills}</div>
              {r.quantity && <div><span className="text-foreground/70">Qty</span> {r.quantity}</div>}
              {r.pharmacy && <div><span className="text-foreground/70">Pharmacy</span> {r.pharmacy}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}