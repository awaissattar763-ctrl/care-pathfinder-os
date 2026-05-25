import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  X,
  Send,
  ShieldCheck,
  Stethoscope,
  FileSignature,
  Pill,
  Receipt,
  CalendarClock,
  ClipboardList,
  Square,
  Lock,
  Command as CommandIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopilot } from "./CopilotContext";
import { Markdown } from "./Markdown";

const QUICK_ACTIONS = [
  { icon: Stethoscope, label: "Symptom check", prompt: "Help me triage symptoms. Ask me for chief complaint, onset, severity, and associated symptoms, then propose differentials." },
  { icon: ClipboardList, label: "Intake summary", prompt: "Draft a structured intake summary from these notes (paste below). Use SOAP format." },
  { icon: Pill, label: "Draft prescription", prompt: "Help me draft a prescription. Ask me for indication, patient weight/age, allergies, then propose drug, dose, route, frequency, and duration with interaction notes." },
  { icon: FileSignature, label: "Summarize history", prompt: "Summarize a patient's chart highlights: active conditions, meds, allergies, recent vitals, last visit reason." },
  { icon: Receipt, label: "Insurance help", prompt: "Help me with an insurance claim. Suggest ICD-10 and CPT codes for the encounter I describe, and flag common denial reasons." },
  { icon: CalendarClock, label: "Triage appointment", prompt: "Help me triage an appointment request. Ask for symptoms and urgency, then recommend in-person vs telemedicine vs ED and the timeframe." },
];

export function AICopilot() {
  const { open, closeCopilot, consumeSeed } = useCopilot();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Focus + consume seed when panel opens
  useEffect(() => {
    if (!open) return;
    const seed = consumeSeed();
    if (seed) {
      setInput(seed);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, consumeSeed]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCopilot();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, closeCopilot]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeCopilot}
        aria-hidden
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="HealthOS Copilot"
        className={cn(
          "fixed right-0 top-0 z-50 h-screen w-full sm:w-[440px] flex flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div
            className="size-9 rounded-xl flex items-center justify-center text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold tracking-tight">HealthOS Copilot</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3 text-success" />
              PHI-aware · Assistant only
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-secondary"
            >
              New chat
            </button>
          )}
          <button
            onClick={closeCopilot}
            aria-label="Close copilot"
            className="size-8 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mx-5 mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-foreground/80 flex items-start gap-2">
          <Lock className="size-3.5 mt-0.5 shrink-0 text-warning" />
          <span>
            <span className="font-semibold">Assistant Only</span> — All outputs require licensed
            medical review before clinical use.
          </span>
        </div>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? <EmptyState onPick={(p) => submit(p)} /> : null}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {status === "submitted" && <TypingIndicator />}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="border-t border-border p-3"
        >
          <div className="rounded-xl border border-border bg-secondary/40 focus-within:ring-2 focus-within:ring-ring/40 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              placeholder="Ask the copilot… (e.g. draft a Rx for otitis media)"
              rows={2}
              className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CommandIcon className="size-3" /> ↵ to send · Shift+↵ newline
              </div>
              {isLoading ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="h-8 px-3 rounded-md bg-secondary hover:bg-secondary/80 text-xs font-medium flex items-center gap-1.5"
                >
                  <Square className="size-3 fill-current" /> Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-8 px-3 rounded-md text-primary-foreground text-xs font-medium flex items-center gap-1.5 disabled:opacity-40"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Send className="size-3.5" /> Send
                </button>
              )}
            </div>
          </div>
        </form>
      </aside>
    </>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/40 to-transparent p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Capabilities</div>
        <div className="mt-1 text-sm text-foreground">
          Triage, document, prescribe, and code — with a licensed clinician in the loop.
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => onPick(a.prompt)}
              className="group text-left rounded-xl border border-border bg-background p-3 hover:border-primary/40 hover:shadow-sm transition"
            >
              <Icon className="size-4 text-primary mb-1.5" />
              <div className="text-xs font-medium leading-tight">{a.label}</div>
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-muted-foreground leading-relaxed">
        The copilot does not store PHI. Treat all outputs as drafts pending clinician review.
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
  if (!text) return null;

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="size-7 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Sparkles className="size-3.5" />
      </div>
      <div className="flex-1 min-w-0 text-sm text-foreground">
        <Markdown text={text} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-center text-muted-foreground">
      <div className="size-7 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Sparkles className="size-3.5 animate-pulse" />
      </div>
      <div className="flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.2s]" />
        <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.1s]" />
        <span className="size-1.5 rounded-full bg-current animate-bounce" />
        <span className="ml-2 text-xs">Thinking…</span>
      </div>
    </div>
  );
}

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