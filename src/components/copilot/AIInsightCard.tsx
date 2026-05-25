import { Sparkles, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useCopilot } from "./CopilotContext";

type Suggestion = { label: string; prompt: string };

export function AIInsightCard({
  title,
  summary,
  suggestions = [],
  badge = "AI summary",
}: {
  title: string;
  summary: string;
  suggestions?: Suggestion[];
  badge?: string;
}) {
  const { openCopilot } = useCopilot();
  return (
    <div
      className="rounded-xl border border-primary/15 p-5 card-hover relative overflow-hidden"
      style={{ background: "var(--gradient-soft, linear-gradient(135deg, color-mix(in oklab, var(--primary) 6%, transparent), transparent))" }}
    >
      <div className="absolute -top-10 -right-10 size-32 rounded-full bg-primary/10 blur-2xl" aria-hidden />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles className="size-3.5" />
            </span>
            <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
              {badge}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3" /> Assistant only
          </span>
        </div>
        <div className="mt-2.5 text-sm font-semibold text-foreground">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{summary}</p>
        {suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => openCopilot(s.prompt)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:border-primary/40 hover:text-primary transition"
              >
                {s.label}
                <ArrowUpRight className="size-3" />
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 text-[10px] italic text-muted-foreground">
          Assistant Only — Requires Licensed Medical Review
        </div>
      </div>
    </div>
  );
}