import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useCopilot } from "./CopilotContext";

export function CopilotLauncher() {
  const { toggleCopilot, open } = useCopilot();

  // Cmd/Ctrl + J shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggleCopilot();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [toggleCopilot]);

  if (open) return null;

  return (
    <button
      onClick={() => toggleCopilot()}
      aria-label="Open HealthOS Copilot"
      title="Open Copilot (⌘J)"
      className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 pl-3 pr-4 h-12 rounded-full text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
      style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
    >
      <span className="relative flex items-center justify-center size-7 rounded-full bg-white/15">
        <Sparkles className="size-4" />
        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-40" />
      </span>
      <span className="text-sm font-medium">Copilot</span>
      <kbd className="hidden sm:inline-flex ml-1 text-[10px] px-1.5 py-0.5 rounded bg-white/15 font-medium">
        ⌘J
      </kbd>
    </button>
  );
}
