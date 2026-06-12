import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Shared error state for failed queries. Mirrors the billing pages' pattern
 * so error handling looks identical across the app.
 */
export function QueryErrorState({
  title = "Couldn't load this data",
  description = "Check your connection and try again.",
  onRetry,
  compact = false,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="size-4 text-warning shrink-0" />
          <span className="truncate">{title}</span>
        </span>
        {onRetry && (
          <button onClick={onRetry} className="text-xs font-medium underline shrink-0">
            Retry
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
      <AlertTriangle className="size-8 mx-auto text-warning mb-3" aria-hidden />
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary mt-4">
          <RefreshCw className="size-4" /> Retry
        </button>
      )}
    </div>
  );
}
