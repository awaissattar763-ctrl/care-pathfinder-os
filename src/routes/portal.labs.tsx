import { createFileRoute } from "@tanstack/react-router";
import { useMyLabResults } from "@/hooks/portal-queries";
import { FlaskConical } from "lucide-react";

export const Route = createFileRoute("/portal/labs")({ component: PortalLabs });

function PortalLabs() {
  const { data, isLoading } = useMyLabResults();
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><FlaskConical className="size-5 text-primary" /> Lab results</h1>
      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {data && data.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No lab results available yet.
        </div>
      )}
      <ul className="space-y-2">
        {(data ?? []).map((l) => {
          const tone =
            l.flag === "critical" ? "border-destructive/40 bg-destructive/5" :
            l.flag === "abnormal" || l.flag === "high" || l.flag === "low" ? "border-warning/40 bg-warning/5" :
            "border-border bg-card";
          return (
            <li key={l.id} className={`rounded-xl border p-4 ${tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{l.test_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(l.resulted_at).toLocaleDateString()} · {l.test_code ?? "—"}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-foreground">{l.flag}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{l.value}</span>
                {l.unit && <span className="text-sm text-muted-foreground">{l.unit}</span>}
              </div>
              {l.reference_range && (
                <div className="text-xs text-muted-foreground mt-1">Reference range: {l.reference_range}</div>
              )}
              {l.notes && <div className="text-xs mt-2 text-foreground/80">{l.notes}</div>}
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-muted-foreground text-center">
        Lab values displayed for reference only. Discuss results with your provider.
      </p>
    </div>
  );
}