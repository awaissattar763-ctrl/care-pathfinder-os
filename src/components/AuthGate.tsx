import { useState, type ReactNode, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Loader2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span>Establishing secure session…</span>
        </div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <>{children}</>;
}

function LoginScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div
            className="size-9 rounded-xl flex items-center justify-center text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Activity className="size-5" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">HealthOS</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Practice OS · v1.0</div>
          </div>
        </div>
        <div className="max-w-md space-y-6">
          <div>
            <div className="label-eyebrow">Trusted by modern practices</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight leading-tight">
              The clinical operating system your team will actually want to use.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Charting, scheduling, prescribing, claims, and an AI copilot — unified under one
              HIPAA-compliant workspace.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-foreground/85">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-success" /> SOC 2 Type II · HITRUST CSF certified
            </li>
            <li className="flex items-center gap-2.5">
              <Lock className="size-4 text-success" /> End-to-end encryption · AES-256
            </li>
          </ul>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 HealthOS, Inc.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <div
              className="size-9 rounded-xl flex items-center justify-center text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Activity className="size-5" />
            </div>
            <div className="font-semibold tracking-tight">HealthOS</div>
          </div>

          <div className="label-eyebrow">{mode === "sign-in" ? "Sign in" : "Create account"}</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {mode === "sign-in" ? "Welcome back" : "Get started"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "sign-in"
              ? "Sign in to access your practice workspace."
              : "Provision a new clinician workspace in seconds."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "sign-up" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Morgan Reyes"
                  className="w-full h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                className="w-full h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Password</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
              />
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "sign-in" ? "Sign in securely" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-xs text-muted-foreground text-center">
            {mode === "sign-in" ? (
              <>
                New to HealthOS?{" "}
                <button onClick={() => setMode("sign-up")} className="text-primary font-medium hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have access?{" "}
                <button onClick={() => setMode("sign-in")} className="text-primary font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="size-3 text-success" /> HIPAA-compliant authentication
          </div>
        </div>
      </div>
    </div>
  );
}