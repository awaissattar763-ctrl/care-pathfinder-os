import { cn } from "@/lib/utils";

export type Urgency = "urgent" | "routine" | "stable";

const styles: Record<Urgency, { dot: string; bg: string; text: string; label: string }> = {
  urgent: { dot: "bg-destructive", bg: "bg-destructive/10", text: "text-destructive", label: "Urgent" },
  routine: { dot: "bg-warning", bg: "bg-warning/15", text: "text-warning", label: "Routine" },
  stable: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: "Stable" },
};

export function UrgencyBadge({ level, children, className }: { level: Urgency; children?: React.ReactNode; className?: string }) {
  const s = styles[level] ?? styles.routine;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium", s.bg, s.text, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {children ?? s.label}
    </span>
  );
}