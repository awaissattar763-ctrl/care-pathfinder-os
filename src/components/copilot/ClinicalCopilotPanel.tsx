import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Copy,
  Save,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Pill,
  ClipboardList,
  Activity,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  generateClinicalSummary,
  saveClinicalSummary,
  type ClinicalSummary,
} from "@/lib/clinical-copilot.functions";

type Patient = {
  id: string;
  name: string;
  insurance: unknown;
  emergency_contact: unknown;
  ai_summary: unknown;
};
type Allergy = { name: string; severity: string | null };
type Vital = { label: string; measured_at: string };
type Rx = { drug: string; status: string | null };
type Appt = { scheduled_at: string; status: string };
type Doc = { name: string };

type Props = {
  patient: Patient;
  allergies: Allergy[];
  vitals: Vital[];
  prescriptions: Rx[];
  appointments: Appt[];
  documents: Doc[];
};

type CareGap = { id: string; label: string; severity: "high" | "med" | "low" };

function computeCareGaps(p: Props): CareGap[] {
  const gaps: CareGap[] = [];
  const ins = p.patient.insurance as { provider?: string; policy?: string } | null;
  if (!ins?.provider || !ins?.policy)
    gaps.push({ id: "ins", label: "Missing insurance information", severity: "high" });

  const ec = p.patient.emergency_contact as { name?: string; phone?: string } | null;
  if (!ec?.name || !ec?.phone)
    gaps.push({ id: "ec", label: "Missing emergency contact", severity: "high" });

  const requiredVitals = ["Blood pressure", "Resting HR", "BMI"];
  const present = new Set(p.vitals.map((v) => v.label));
  for (const r of requiredVitals) {
    if (!present.has(r)) gaps.push({ id: `v-${r}`, label: `Missing vital: ${r}`, severity: "med" });
  }

  const recentVital = p.vitals[0]?.measured_at ? new Date(p.vitals[0].measured_at) : null;
  if (recentVital && Date.now() - recentVital.getTime() > 1000 * 60 * 60 * 24 * 180)
    gaps.push({ id: "vstale", label: "Vitals not updated in over 6 months", severity: "med" });

  const hasUpcoming = p.appointments.some(
    (a) => new Date(a.scheduled_at) > new Date() && a.status !== "cancelled",
  );
  if (!hasUpcoming)
    gaps.push({ id: "fu", label: "No upcoming follow-up appointment", severity: "med" });

  if (p.documents.length === 0)
    gaps.push({ id: "docs", label: "No clinical documentation on file", severity: "low" });

  return gaps;
}

const TABS = [
  { id: "summary", label: "Summary", icon: ClipboardList },
  { id: "visit", label: "Visit Prep", icon: Stethoscope },
  { id: "meds", label: "Med Safety", icon: Pill },
  { id: "gaps", label: "Care Gaps", icon: Activity },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ClinicalCopilotPanel(props: Props) {
  const [tab, setTab] = useState<TabId>("summary");
  const cached = (props.patient.ai_summary as { summary?: ClinicalSummary; generatedAt?: string } | null) ?? null;
  const [summary, setSummary] = useState<ClinicalSummary | null>(cached?.summary ?? null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(cached?.generatedAt ?? null);

  const generate = useServerFn(generateClinicalSummary);
  const save = useServerFn(saveClinicalSummary);

  const gen = useMutation({
    mutationFn: () => generate({ data: { patientId: props.patient.id } }),
    onSuccess: (r) => {
      setSummary(r.summary);
      setGeneratedAt(r.generatedAt);
      toast.success("Clinical brief generated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      save({ data: { patientId: props.patient.id, summary: summary!, generatedAt: generatedAt! } }),
    onSuccess: () => toast.success("Saved to chart"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const careGaps = useMemo(() => computeCareGaps(props), [props]);

  const copyAll = async () => {
    if (!summary) return;
    const text = renderSummaryText(summary, careGaps, props.patient.name);
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const isLoading = gen.isPending;

  return (
    <div className="rounded-xl border border-primary/15 overflow-hidden"
      style={{ background: "var(--gradient-soft, linear-gradient(135deg, color-mix(in oklab, var(--primary) 5%, transparent), transparent))" }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-primary/10 bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg flex items-center justify-center text-primary-foreground"
               style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Sparkles className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Clinical Copilot</h2>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3 text-warning" />
              Assistant Only — Requires Clinical Review
              {generatedAt && (
                <span className="ml-2 text-muted-foreground/70">
                  · {new Date(generatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => gen.mutate()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : summary ? (
              <RefreshCw className="size-3.5" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {summary ? "Regenerate" : "Generate brief"}
          </button>
          <button
            onClick={copyAll}
            disabled={!summary}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-card hover:bg-secondary disabled:opacity-40"
          >
            <Copy className="size-3.5" /> Copy
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={!summary || saveMut.isPending}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-card hover:bg-secondary disabled:opacity-40"
          >
            {saveMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save to chart
          </button>
        </div>
      </header>

      <div className="flex items-center gap-1 px-4 pt-3 border-b border-primary/10">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const badge = t.id === "gaps" ? careGaps.length : 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md border-b-2 transition",
                active
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
              {badge > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-warning/20 text-warning text-[10px] font-semibold">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6 min-h-[200px]">
        {gen.isError && !summary && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Could not generate brief. {gen.error instanceof Error ? gen.error.message : ""}
          </div>
        )}

        {isLoading && !summary && <LoadingSkeleton />}

        {!isLoading && !summary && !gen.isError && (
          <EmptyState onGenerate={() => gen.mutate()} />
        )}

        {summary && tab === "summary" && <SummaryView s={summary} />}
        {summary && tab === "visit" && <VisitView s={summary} />}
        {summary && tab === "meds" && <MedSafetyView s={summary} />}
        {tab === "gaps" && <GapsView gaps={careGaps} />}

        <p className="mt-6 text-[11px] italic text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="size-3" />
          Assistant Only — Requires Clinical Review. Not a substitute for clinical judgment.
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-primary/10" />
      <div className="h-4 w-full rounded bg-primary/10" />
      <div className="h-4 w-5/6 rounded bg-primary/10" />
      <div className="h-20 mt-4 rounded-lg bg-primary/5" />
      <div className="h-20 rounded-lg bg-primary/5" />
    </div>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Sparkles className="size-5" />
      </div>
      <div className="text-sm font-medium">No brief generated yet</div>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        Generate a clinician-ready briefing drawn only from this patient's stored record.
      </p>
      <button
        onClick={onGenerate}
        className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-medium text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Sparkles className="size-3.5" /> Generate brief
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-eyebrow mb-1.5">{label}</div>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (!items?.length)
    return <div className="text-sm text-muted-foreground italic">{empty}</div>;
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-primary mt-1.5 size-1.5 rounded-full bg-current shrink-0" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function SummaryView({ s }: { s: ClinicalSummary }) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
        <div className="text-sm font-medium">{s.oneLiner}</div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Active conditions">{s.activeConditionsNarrative}</Field>
        <Field label="Current medications">{s.medicationsNarrative}</Field>
        <Field label="Allergies">{s.allergiesNarrative}</Field>
        <Field label="Recent visits">{s.recentVisitsNarrative}</Field>
      </div>
      <Field label="Outstanding tasks">
        <BulletList items={s.outstandingTasks} empty="No outstanding tasks detected." />
      </Field>
    </div>
  );
}

function VisitView({ s }: { s: ClinicalSummary }) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Field label="Risk factors">
        <BulletList items={s.visitPrep.riskFactors} empty="No risk factors highlighted." />
      </Field>
      <Field label="Overdue follow-ups">
        <BulletList items={s.visitPrep.overdueFollowUps} empty="No overdue follow-ups." />
      </Field>
      <Field label="Missing documentation">
        <BulletList items={s.visitPrep.missingDocumentation} empty="Documentation appears complete." />
      </Field>
      <Field label="Suggested talking points">
        <BulletList items={s.visitPrep.talkingPoints} empty="—" />
      </Field>
    </div>
  );
}

function SafetyRow({
  icon: Icon,
  tone,
  label,
  items,
  empty,
}: {
  icon: typeof AlertTriangle;
  tone: "warning" | "destructive" | "muted";
  label: string;
  items: string[];
  empty: string;
}) {
  const toneCls =
    tone === "destructive"
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10 text-warning"
        : "border-border bg-secondary/40 text-muted-foreground";
  return (
    <div className={cn("rounded-lg border p-4", toneCls)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-2 text-foreground">
        <BulletList items={items} empty={empty} />
      </div>
    </div>
  );
}

function MedSafetyView({ s }: { s: ClinicalSummary }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-foreground flex gap-2 items-start">
        <ShieldCheck className="size-3.5 mt-0.5 text-warning" />
        Medication safety output is a draft for clinician review. Verify all flags against the live record before acting.
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <SafetyRow icon={AlertTriangle} tone="destructive" label="Allergy conflicts"
                   items={s.medicationSafety.allergyConflicts} empty="None detected." />
        <SafetyRow icon={AlertTriangle} tone="warning" label="Duplicate therapies"
                   items={s.medicationSafety.duplicates} empty="None detected." />
        <SafetyRow icon={AlertTriangle} tone="warning" label="High-risk combinations"
                   items={s.medicationSafety.highRiskCombinations} empty="None detected." />
      </div>
      {s.medicationSafety.notes && (
        <Field label="Notes">{s.medicationSafety.notes}</Field>
      )}
    </div>
  );
}

function GapsView({ gaps }: { gaps: CareGap[] }) {
  if (!gaps.length)
    return (
      <div className="flex flex-col items-center text-center py-8">
        <CheckCircle2 className="size-8 text-success mb-2" />
        <div className="text-sm font-medium">No care gaps detected</div>
        <div className="text-xs text-muted-foreground mt-1">All required record fields are present.</div>
      </div>
    );
  return (
    <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {gaps.map((g) => (
        <li key={g.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-card">
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={cn(
                "size-4",
                g.severity === "high"
                  ? "text-destructive"
                  : g.severity === "med"
                    ? "text-warning"
                    : "text-muted-foreground",
              )}
            />
            <span className="text-sm">{g.label}</span>
          </div>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md",
              g.severity === "high"
                ? "bg-destructive/10 text-destructive"
                : g.severity === "med"
                  ? "bg-warning/15 text-warning"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {g.severity}
          </span>
        </li>
      ))}
    </ul>
  );
}

function renderSummaryText(s: ClinicalSummary, gaps: CareGap[], name: string) {
  const lines: string[] = [];
  lines.push(`Clinical Copilot Brief — ${name}`);
  lines.push(`Assistant Only — Requires Clinical Review`);
  lines.push("");
  lines.push(s.oneLiner);
  lines.push("");
  lines.push("Active conditions: " + s.activeConditionsNarrative);
  lines.push("Medications: " + s.medicationsNarrative);
  lines.push("Allergies: " + s.allergiesNarrative);
  lines.push("Recent visits: " + s.recentVisitsNarrative);
  lines.push("");
  lines.push("Outstanding tasks:");
  s.outstandingTasks.forEach((t) => lines.push(" - " + t));
  lines.push("");
  lines.push("Visit prep — risk factors:");
  s.visitPrep.riskFactors.forEach((t) => lines.push(" - " + t));
  lines.push("Overdue follow-ups:");
  s.visitPrep.overdueFollowUps.forEach((t) => lines.push(" - " + t));
  lines.push("Missing documentation:");
  s.visitPrep.missingDocumentation.forEach((t) => lines.push(" - " + t));
  lines.push("");
  lines.push("Medication safety — allergy conflicts: " + (s.medicationSafety.allergyConflicts.join("; ") || "none"));
  lines.push("Duplicates: " + (s.medicationSafety.duplicates.join("; ") || "none"));
  lines.push("High-risk combos: " + (s.medicationSafety.highRiskCombinations.join("; ") || "none"));
  lines.push("");
  lines.push("Care gaps:");
  gaps.forEach((g) => lines.push(` - [${g.severity}] ${g.label}`));
  return lines.join("\n");
}