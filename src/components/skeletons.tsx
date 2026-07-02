import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton row grid for tabular data. Use inside a `.surface` container while
 * `isLoading` is true to preserve layout height.
 */
export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("p-6 space-y-3", className)} aria-busy="true" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Vertical stack of skeleton lines for list-style layouts (cards, feeds).
 */
export function ListSkeleton({
  rows = 5,
  className,
  itemClassName = "h-12 w-full",
}: {
  rows?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn("p-6 space-y-3", className)} aria-busy="true" aria-label="Loading list">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={itemClassName} />
      ))}
    </div>
  );
}