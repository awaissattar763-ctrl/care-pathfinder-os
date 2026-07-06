import { Building2, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMyClinics, useActiveClinicId, useSetActiveClinic } from "@/hooks/queries/tenant";
import { cn } from "@/lib/utils";

export function ClinicSwitcher() {
  const { data: clinics = [] } = useMyClinics();
  const { data: activeId } = useActiveClinicId();
  const setActive = useSetActiveClinic();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (clinics.length === 0) return null;
  const active = clinics.find((c) => c.id === activeId) ?? clinics[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-background hover:border-primary/40 text-xs font-medium transition min-w-0 max-w-[220px]"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`${active?.org?.name ?? ""} · ${active?.name ?? ""}`}
      >
        <Building2 className="size-3.5 text-primary shrink-0" aria-hidden />
        <span className="truncate">{active?.name ?? "Select clinic"}</span>
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1 w-64 rounded-lg border border-border bg-popover shadow-lg z-50 py-1 animate-fade-in-up"
        >
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
            Switch clinic
          </div>
          {clinics.map((c) => {
            const isActive = c.id === (activeId ?? active?.id);
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActive.mutate(c.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-secondary transition",
                  isActive && "bg-secondary/60",
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.org?.name}</div>
                </div>
                {isActive && <Check className="size-3.5 text-primary shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}