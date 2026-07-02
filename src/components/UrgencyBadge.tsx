import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { URGENCY_LABEL, type UrgencyLevel } from "@/lib/constants";

export type Urgency = UrgencyLevel;

const styles: Record<Urgency, { dot: string; bg: string; text: string }> = {
  critical: { dot: "bg-destructive", bg: "bg-destructive/15", text: "text-destructive" },
  urgent: { dot: "bg-destructive", bg: "bg-destructive/10", text: "text-destructive" },
  routine: { dot: "bg-warning", bg: "bg-warning/15", text: "text-warning" },
  stable: { dot: "bg-success", bg: "bg-success/10", text: "text-success" },
};

export function UrgencyBadge({ level, children, className }: { level: Urgency; children?: ReactNode; className?: string }) {
  const s = styles[level] ?? styles.routine;
  const label = URGENCY_LABEL[level] ?? URGENCY_LABEL.routine;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium", s.bg, s.text, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {children ?? label}
    </span>
  );
}