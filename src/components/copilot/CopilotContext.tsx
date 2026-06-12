import { createContext, useCallback, useContext, useMemo, useState } from "react";

type CopilotState = {
  open: boolean;
  seed: string | null;
  openCopilot: (prompt?: string) => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  consumeSeed: () => string | null;
};

const Ctx = createContext<CopilotState | null>(null);

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  const openCopilot = useCallback((prompt?: string) => {
    if (prompt) setSeed(prompt);
    setOpen(true);
  }, []);
  const closeCopilot = useCallback(() => setOpen(false), []);
  const toggleCopilot = useCallback(() => setOpen((v) => !v), []);
  const consumeSeed = useCallback(() => {
    const s = seed;
    setSeed(null);
    return s;
  }, [seed]);

  const value = useMemo(
    () => ({ open, seed, openCopilot, closeCopilot, toggleCopilot, consumeSeed }),
    [open, seed, openCopilot, closeCopilot, toggleCopilot, consumeSeed],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCopilot() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCopilot must be used within CopilotProvider");
  return v;
}