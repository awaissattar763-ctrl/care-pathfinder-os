import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Download, Plus, Pill, FileText } from "lucide-react";
import { usePrescriptions } from "@/hooks/queries";
import { NewPrescriptionDialog } from "@/components/dialogs/NewPrescriptionDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/prescriptions")({ component: PrescriptionsPage });

const pillTone: Record<string, string> = {
  Sent: "pill pill--success",
  Draft: "pill pill--warning",
  Cancelled: "pill pill--danger",
};

function PrescriptionsPage() {
  const { data: rxList, isLoading } = usePrescriptions();
  const preview = rxList?.[0];

  return (
    <div>
      <PageHeader
        eyebrow="e-Rx"
        title="Prescriptions"
        description="Compose, e-sign, and dispatch prescriptions via Surescripts."
        actions={
          <>
            <button className="btn btn-secondary">Templates</button>
            <NewPrescriptionDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> New prescription</button>} />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 surface">
          <div className="section-head">
            <div>
              <div className="section-head__title">Recent prescriptions</div>
              <div className="section-head__sub">{rxList?.length ?? 0} total · Surescripts queue clear</div>
            </div>
            <button className="btn btn-ghost btn-sm">View all</button>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !rxList || rxList.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No prescriptions yet"
              description="Compose your first prescription to dispatch via Surescripts."
              action={<NewPrescriptionDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> New prescription</button>} />}
            />
          ) : (
            <ul className="divide-y divide-border">
              {rxList.map((r, i) => (
                <li key={r.id} className="px-5 py-4 flex items-center gap-4 hover:bg-primary/[0.04] transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden>
                    <Pill className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.drug}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.patient?.name ?? "Unassigned"} · {r.sig} · {r.quantity ?? "—"} · Refills {r.refills}
                    </div>
                  </div>
                  <div className="hidden md:block text-xs text-muted-foreground truncate max-w-[10rem]">{r.pharmacy ?? "—"}</div>
                  <span className={pillTone[r.status] ?? "pill pill--neutral"}>{r.status}</span>
                  <button className="btn btn-ghost btn-sm" aria-label={`Download PDF for ${r.rx_number}`}>
                    <Download className="size-3.5" /> PDF
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="section-head__title">Preview</div>
            <span className="pill pill--neutral">PDF</span>
          </div>
          <div className="rounded-lg border border-dashed border-border p-5 bg-secondary/30">
            <div className="text-[11px] text-muted-foreground tracking-widest uppercase">
              HealthOS Rx · {preview?.rx_number ?? "—"}
            </div>
            <div className="mt-3 font-serif text-xl text-primary italic">℞</div>
            <div className="mt-2 text-sm">
              <div className="font-semibold">{preview?.patient?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{preview?.patient?.mrn ?? ""}</div>
            </div>
            <div className="mt-4 text-sm border-t border-border pt-3">
              <div className="font-medium">{preview?.drug ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Sig: {preview?.sig ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                Disp: {preview?.quantity ?? "—"} · Refills: {preview?.refills ?? 0} · DAW: No
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <FileText className="size-3" aria-hidden /> e-Signed ·{" "}
              {preview?.created_at ? new Date(preview.created_at).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
