import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FlaskConical, Plus, Filter, AlertTriangle, ArrowUpRight, Activity, ClipboardCheck, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { NewLabOrderDialog } from "@/components/dialogs/NewLabOrderDialog";
import { LabResultDrawer } from "@/components/labs/LabResultDrawer";
import { useLabOrders, useUpdateLabOrderStatus, type LabOrderWithRefs } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/labs")({ component: LabsPage });

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ordered", label: "Ordered" },
  { key: "collected", label: "Collected" },
  { key: "resulted", label: "Resulted" },
  { key: "cancelled", label: "Cancelled" },
];

function statusPill(s: string) {
  switch (s) {
    case "ordered": return "pill--info";
    case "collected": return "pill--warning";
    case "resulted": return "pill--success";
    case "cancelled": return "pill--neutral";
    default: return "pill--neutral";
  }
}

function LabsPage() {
  const { data, isLoading } = useLabOrders();
  const [tab, setTab] = useState("all");
  const [active, setActive] = useState<LabOrderWithRefs | null>(null);
  const update = useUpdateLabOrderStatus();

  const filtered = useMemo(() => {
    const all = data ?? [];
    return tab === "all" ? all : all.filter((o) => o.status === tab);
  }, [data, tab]);

  const stats = useMemo(() => {
    const all = data ?? [];
    return {
      total: all.length,
      ordered: all.filter((o) => o.status === "ordered").length,
      resulted: all.filter((o) => o.status === "resulted").length,
      critical: all.flatMap((o) => o.results).filter((r) => r.flag === "critical").length,
    };
  }, [data]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        eyebrow="Diagnostics"
        title="Lab orders & results"
        description="Order tests, track collection, and review discrete results in one place."
        actions={
          <NewLabOrderDialog
            trigger={<button className="btn btn-primary"><Plus className="size-4" /> New lab order</button>}
          />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total orders" value={stats.total} icon={FlaskConical} />
        <KpiCard label="Awaiting collection" value={stats.ordered} icon={Clock} accent="text-primary" />
        <KpiCard label="Resulted" value={stats.resulted} icon={ClipboardCheck} accent="text-success" />
        <KpiCard label="Critical flags" value={stats.critical} icon={AlertTriangle} accent={stats.critical > 0 ? "text-destructive" : ""} />
      </div>

      <div className="surface overflow-hidden">
        <div className="section-head">
          <div>
            <div className="section-head__title">Queue</div>
            <div className="section-head__sub">{filtered.length} order{filtered.length === 1 ? "" : "s"}</div>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            {STATUS_TABS.map((s) => (
              <button
                key={s.key}
                onClick={() => setTab(s.key)}
                className={cn(
                  "px-3 h-8 rounded-md text-xs font-medium transition",
                  tab === s.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title={tab === "all" ? "No lab orders yet" : `No ${tab} orders`}
            description="Submit an order to start the diagnostic workflow."
            action={<NewLabOrderDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> New lab order</button>} />}
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((o, i) => {
              const critical = o.results.some((r) => r.flag === "critical");
              const abnormal = o.results.some((r) => r.flag === "high" || r.flag === "low" || r.flag === "abnormal");
              return (
                <li
                  key={o.id}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-primary/[0.04] transition-colors cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => setActive(o)}
                >
                  <div className={cn(
                    "size-10 rounded-lg flex items-center justify-center shrink-0",
                    critical ? "bg-destructive/10 text-destructive" : abnormal ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary",
                  )}>
                    <FlaskConical className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{o.patient?.name ?? "Unassigned"}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{o.order_number}</span>
                      {o.priority === "stat" && <span className="pill pill--danger text-[10px]">STAT</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {o.tests.length} test{o.tests.length === 1 ? "" : "s"}
                      {o.tests.length > 0 && ` · ${o.tests.slice(0, 3).map((t) => t.test_name).join(", ")}${o.tests.length > 3 ? "…" : ""}`}
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end text-xs text-muted-foreground">
                    <span>{new Date(o.ordered_at).toLocaleDateString()}</span>
                    <span>{o.lab_facility ?? "—"}</span>
                  </div>
                  <span className={`pill ${statusPill(o.status)}`}>{o.status}</span>
                  {critical && <AlertTriangle className="size-4 text-destructive" aria-label="Critical result" />}
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <LabResultDrawer
        order={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        onAdvance={(status) => active && update.mutate({ id: active.id, status })}
      />
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent?: string }) {
  return (
    <div className="surface p-5 lift-on-hover">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{label}</div>
        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className={cn("size-4", accent)} />
        </div>
      </div>
      <div className="mt-3 text-[1.625rem] font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}