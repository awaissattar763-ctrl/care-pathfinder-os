import { useMemo, useState } from "react";
import {
  ListChecks,
  Stethoscope,
  Scissors,
  Users,
  Cigarette,
  Syringe,
  Image as ImageIcon2,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  usePatientEmr,
  useEmrInsert,
  useEmrDelete,
  useUpsertSocialHistory,
  useCompleteTask,
  type SocialHistory,
} from "@/hooks/queries/emr";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Vital } from "@/hooks/queries";

type FieldSpec = {
  key: string;
  label: string;
  type?: "text" | "date" | "number" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

function QuickAddDialog({
  title,
  fields,
  onSubmit,
  triggerLabel = "Add",
}: {
  title: string;
  fields: FieldSpec[];
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = values[f.key];
        if (raw === undefined || raw === "") continue;
        payload[f.key] = f.type === "number" ? Number(raw) : raw;
      }
      await onSubmit(payload);
      setValues({});
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
          <Plus className="size-3" /> {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key} className="text-xs">
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.key}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  required={f.required}
                  rows={3}
                />
              ) : f.type === "select" ? (
                <Select value={values[f.key] ?? ""} onValueChange={(v) => set(f.key, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={f.placeholder ?? "Select…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={f.key}
                  type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  required={f.required}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-xl border border-border bg-card scroll-mt-24"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="size-7 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground inline-flex items-center justify-center"
      aria-label="Remove"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

/* -------------------- Growth chart helper -------------------- */

function GrowthChart({ data, unit, label }: { data: { date: string; value: number }[]; unit: string; label: string }) {
  const w = 320;
  const h = 120;
  if (data.length === 0) return <Empty text={`No ${label.toLowerCase()} measurements yet.`} />;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((d, i) => [i * step, h - ((d.value - min) / range) * (h - 16) - 8]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <div className="rounded-lg border border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xs tabular-nums font-medium">
          {vals[vals.length - 1]} <span className="text-muted-foreground">{unit}</span>
        </div>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill="var(--primary)" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
        <span>{formatDate(data[0].date)}</span>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

/* -------------------- Combined chart timeline event type -------------------- */

type TimelineEvent = { date: string; type: string; title: string; by?: string; note?: string };

export function ClinicalTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return <Empty text="No timeline events yet." />;
  return (
    <ol className="relative border-l border-border ml-2 space-y-5">
      {events.map((t, i) => (
        <li key={i} className="pl-5 relative">
          <span className="absolute -left-1.5 top-1.5 size-3 rounded-full bg-card border-2 border-primary" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{formatDate(t.date)}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {t.type}
            </span>
          </div>
          <div className="text-sm font-medium mt-0.5">{t.title}</div>
          {(t.by || t.note) && (
            <div className="text-xs text-muted-foreground">
              {t.by ? `${t.by}` : ""}
              {t.by && t.note ? " — " : ""}
              {t.note ?? ""}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/* -------------------- Main sections component -------------------- */

export function PatientEmrSections({
  patientId,
  vitals,
  extraTimelineEvents,
}: {
  patientId: string;
  vitals: Vital[];
  extraTimelineEvents: TimelineEvent[];
}) {
  const { data, isLoading } = usePatientEmr(patientId);

  const insertProblem = useEmrInsert("problems");
  const insertMed = useEmrInsert("medical_history");
  const insertSurg = useEmrInsert("surgical_history");
  const insertFam = useEmrInsert("family_history");
  const insertImm = useEmrInsert("immunizations");
  const insertImg = useEmrInsert("imaging_studies");
  const insertPlan = useEmrInsert("care_plans");
  const insertTask = useEmrInsert("follow_up_tasks");
  const upsertSocial = useUpsertSocialHistory();
  const completeTask = useCompleteTask();

  const delProblem = useEmrDelete("problems");
  const delMed = useEmrDelete("medical_history");
  const delSurg = useEmrDelete("surgical_history");
  const delFam = useEmrDelete("family_history");
  const delImm = useEmrDelete("immunizations");
  const delImg = useEmrDelete("imaging_studies");
  const delPlan = useEmrDelete("care_plans");
  const delTask = useEmrDelete("follow_up_tasks");

  // Growth data from vitals
  const heightSeries = useMemo(
    () =>
      (vitals ?? [])
        .filter((v) => /height/i.test(v.label))
        .map((v) => ({ date: v.measured_at as string, value: Number(v.value) }))
        .filter((d) => !Number.isNaN(d.value))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [vitals],
  );
  const weightSeries = useMemo(
    () =>
      (vitals ?? [])
        .filter((v) => /weight/i.test(v.label))
        .map((v) => ({ date: v.measured_at as string, value: Number(v.value) }))
        .filter((d) => !Number.isNaN(d.value))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [vitals],
  );
  const bmiSeries = useMemo(
    () =>
      (vitals ?? [])
        .filter((v) => /bmi/i.test(v.label))
        .map((v) => ({ date: v.measured_at as string, value: Number(v.value) }))
        .filter((d) => !Number.isNaN(d.value))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [vitals],
  );

  const clinicalTimeline = useMemo<TimelineEvent[]>(() => {
    const base: TimelineEvent[] = [...extraTimelineEvents];
    for (const p of data?.problems ?? [])
      base.push({ date: p.onset_date ?? p.created_at, type: "Problem", title: p.name, note: p.icd10 ?? undefined });
    for (const s of data?.surgicalHistory ?? [])
      base.push({ date: s.procedure_date ?? s.created_at, type: "Surgery", title: s.procedure, by: s.surgeon ?? undefined });
    for (const i of data?.immunizations ?? [])
      base.push({ date: i.administered_date ?? i.created_at, type: "Immunization", title: i.vaccine });
    for (const im of data?.imagingStudies ?? [])
      base.push({ date: im.study_date ?? im.created_at, type: "Imaging", title: im.study_name, note: im.impression ?? undefined });
    return base.filter((e) => e.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 40);
  }, [data, extraTimelineEvents]);

  if (isLoading) {
    return <div className="text-xs text-muted-foreground p-6">Loading clinical record…</div>;
  }

  const problems = data?.problems ?? [];
  const activeProblems = problems.filter((p) => p.status === "active");
  const resolvedProblems = problems.filter((p) => p.status !== "active");
  const social = data?.socialHistory ?? null;
  const tasks = data?.followUpTasks ?? [];
  const openTasks = tasks.filter((t) => t.status !== "completed");

  return (
    <>
      {/* Problem list & Diagnoses */}
      <Section
        id="problems"
        icon={ListChecks}
        title="Problem list & diagnoses"
        description="Active and resolved diagnoses (ICD-10)."
        action={
          <QuickAddDialog
            title="Add problem"
            triggerLabel="Add problem"
            fields={[
              { key: "name", label: "Problem", required: true },
              { key: "icd10", label: "ICD-10 code" },
              { key: "status", label: "Status", type: "select", options: ["active", "resolved", "monitoring", "inactive"] },
              { key: "onset_date", label: "Onset date", type: "date" },
              { key: "note", label: "Note", type: "textarea" },
            ]}
            onSubmit={(v) => insertProblem.mutateAsync({ ...(v as Record<string, unknown>), patient_id: patientId })}
          />
        }
      >
        {problems.length === 0 ? (
          <Empty text="No problems documented." />
        ) : (
          <div className="space-y-4">
            <div>
              <div className="label-eyebrow mb-2">Active ({activeProblems.length})</div>
              {activeProblems.length === 0 ? (
                <Empty text="No active problems." />
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {activeProblems.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.icd10 ? `ICD-10 ${p.icd10} · ` : ""}
                          onset {formatDate(p.onset_date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-1 rounded-md bg-warning/15 text-warning">
                          {p.status}
                        </span>
                        <DeleteBtn onClick={() => delProblem.mutate({ id: p.id, patient_id: patientId })} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {resolvedProblems.length > 0 && (
              <div>
                <div className="label-eyebrow mb-2">Resolved ({resolvedProblems.length})</div>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {resolvedProblems.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/40">
                          {p.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          resolved {formatDate(p.resolved_date)}
                        </div>
                      </div>
                      <DeleteBtn onClick={() => delProblem.mutate({ id: p.id, patient_id: patientId })} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Medical history */}
      <Section
        id="medical-history"
        icon={Stethoscope}
        title="Medical history"
        description="Past medical conditions."
        action={
          <QuickAddDialog
            title="Add past condition"
            fields={[
              { key: "condition", label: "Condition", required: true },
              { key: "year_diagnosed", label: "Year diagnosed", type: "number" },
              { key: "status", label: "Status", type: "select", options: ["past", "active", "resolved"] },
              { key: "note", label: "Note", type: "textarea" },
            ]}
            onSubmit={(v) => insertMed.mutateAsync({ ...(v as Record<string, unknown>), patient_id: patientId })}
          />
        }
      >
        {(data?.medicalHistory ?? []).length === 0 ? (
          <Empty text="No past medical history recorded." />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data!.medicalHistory.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{m.condition}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.year_diagnosed ? `Diagnosed ${m.year_diagnosed}` : "—"}
                    {m.note ? ` · ${m.note}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                    {m.status ?? "past"}
                  </span>
                  <DeleteBtn onClick={() => delMed.mutate({ id: m.id, patient_id: patientId })} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Surgical history */}
      <Section
        id="surgical-history"
        icon={Scissors}
        title="Surgical history"
        action={
          <QuickAddDialog
            title="Add procedure"
            fields={[
              { key: "procedure", label: "Procedure", required: true },
              { key: "procedure_date", label: "Date", type: "date" },
              { key: "surgeon", label: "Surgeon" },
              { key: "facility", label: "Facility" },
              { key: "note", label: "Note", type: "textarea" },
            ]}
            onSubmit={(v) => insertSurg.mutateAsync({ ...(v as Record<string, unknown>), patient_id: patientId })}
          />
        }
      >
        {(data?.surgicalHistory ?? []).length === 0 ? (
          <Empty text="No surgical procedures on record." />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data!.surgicalHistory.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{s.procedure}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(s.procedure_date)}
                    {s.surgeon ? ` · ${s.surgeon}` : ""}
                    {s.facility ? ` · ${s.facility}` : ""}
                  </div>
                </div>
                <DeleteBtn onClick={() => delSurg.mutate({ id: s.id, patient_id: patientId })} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Family history */}
      <Section
        id="family-history"
        icon={Users}
        title="Family history"
        action={
          <QuickAddDialog
            title="Add family history"
            fields={[
              {
                key: "relation",
                label: "Relation",
                type: "select",
                required: true,
                options: ["Mother", "Father", "Sister", "Brother", "Maternal grandparent", "Paternal grandparent", "Aunt", "Uncle", "Child"],
              },
              { key: "condition", label: "Condition", required: true },
              { key: "age_of_onset", label: "Age of onset", type: "number" },
              { key: "note", label: "Note", type: "textarea" },
            ]}
            onSubmit={(v) => insertFam.mutateAsync({ ...(v as Record<string, unknown>), patient_id: patientId })}
          />
        }
      >
        {(data?.familyHistory ?? []).length === 0 ? (
          <Empty text="No family history recorded." />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data!.familyHistory.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">
                    {f.relation} — {f.condition}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {f.age_of_onset ? `Onset age ${f.age_of_onset}` : "—"}
                    {f.deceased ? " · deceased" : ""}
                    {f.note ? ` · ${f.note}` : ""}
                  </div>
                </div>
                <DeleteBtn onClick={() => delFam.mutate({ id: f.id, patient_id: patientId })} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Social history */}
      <SocialHistorySection
        patientId={patientId}
        social={social}
        onSave={(patch) => upsertSocial.mutateAsync({ ...patch, patient_id: patientId })}
      />

      {/* Immunizations */}
      <Section
        id="immunizations"
        icon={Syringe}
        title="Immunizations"
        description="Administered vaccines and upcoming doses."
        action={
          <QuickAddDialog
            title="Add immunization"
            fields={[
              { key: "vaccine", label: "Vaccine", required: true },
              { key: "administered_date", label: "Administered", type: "date" },
              { key: "dose_number", label: "Dose #", type: "number" },
              { key: "lot_number", label: "Lot #" },
              { key: "administered_by", label: "Administered by" },
              { key: "next_due_date", label: "Next due", type: "date" },
            ]}
            onSubmit={(v) => insertImm.mutateAsync({ ...(v as Record<string, unknown>), patient_id: patientId })}
          />
        }
      >
        {(data?.immunizations ?? []).length === 0 ? (
          <Empty text="No immunizations on record." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Vaccine</th>
                  <th className="text-left font-semibold px-4 py-3">Given</th>
                  <th className="text-left font-semibold px-4 py-3">Dose</th>
                  <th className="text-left font-semibold px-4 py-3">Lot</th>
                  <th className="text-left font-semibold px-4 py-3">Next due</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data!.immunizations.map((i) => (
                  <tr key={i.id} className="hover:bg-secondary/40 transition">
                    <td className="px-4 py-3 font-medium">{i.vaccine}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(i.administered_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{i.dose_number ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.lot_number ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(i.next_due_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <DeleteBtn onClick={() => delImm.mutate({ id: i.id, patient_id: patientId })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Imaging history */}
      <Section
        id="imaging-history"
        icon={ImageIcon2}
        title="Imaging history"
        description="Radiology and diagnostic imaging."
        action={
          <QuickAddDialog
            title="Add imaging study"
            fields={[
              { key: "study_name", label: "Study", required: true },
              { key: "modality", label: "Modality", type: "select", options: ["X-Ray", "CT", "MRI", "Ultrasound", "PET", "Mammography", "ECG", "PFT"], required: true },
              { key: "body_part", label: "Body part" },
              { key: "study_date", label: "Date", type: "date" },
              { key: "facility", label: "Facility" },
              { key: "ordered_by", label: "Ordered by" },
              { key: "impression", label: "Impression", type: "textarea" },
            ]}
            onSubmit={(v) => insertImg.mutateAsync({ ...(v as Record<string, unknown>), patient_id: patientId })}
          />
        }
      >
        {(data?.imagingStudies ?? []).length === 0 ? (
          <Empty text="No imaging studies on file." />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data!.imagingStudies.map((i) => (
              <li key={i.id} className="flex items-start gap-3 px-4 py-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-0.5">
                  {i.modality}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{i.study_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(i.study_date)}
                    {i.body_part ? ` · ${i.body_part}` : ""}
                    {i.facility ? ` · ${i.facility}` : ""}
                  </div>
                  {i.impression && (
                    <div className="text-xs text-foreground/75 mt-1 line-clamp-2">{i.impression}</div>
                  )}
                </div>
                <DeleteBtn onClick={() => delImg.mutate({ id: i.id, patient_id: patientId })} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Growth charts */}
      <Section
        id="growth"
        icon={Ruler}
        title="Growth charts"
        description="Height, weight and BMI trend derived from recorded vitals."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GrowthChart data={heightSeries} unit="cm" label="Height" />
          <GrowthChart data={weightSeries} unit="kg" label="Weight" />
          <GrowthChart data={bmiSeries} unit="kg/m²" label="BMI" />
        </div>
      </Section>

      {/* Care plans */}
      <Section
        id="care-plans"
        icon={Target}
        title="Care plans"
        description="Longitudinal goals and interventions."
        action={
          <QuickAddDialog
            title="Add care plan"
            fields={[
              { key: "title", label: "Title", required: true },
              { key: "goal", label: "Goal", type: "textarea" },
              { key: "status", label: "Status", type: "select", options: ["active", "on_hold", "completed"] },
              { key: "start_date", label: "Start date", type: "date" },
              { key: "target_date", label: "Target date", type: "date" },
              { key: "interventions", label: "Interventions", type: "textarea" },
            ]}
            onSubmit={(v) => insertPlan.mutateAsync({ ...(v as Record<string, unknown>), patient_id: patientId })}
          />
        }
      >
        {(data?.carePlans ?? []).length === 0 ? (
          <Empty text="No care plans yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data!.carePlans.map((c) => (
              <article key={c.id} className="rounded-lg border border-border p-4 bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{c.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.start_date ? `Start ${formatDate(c.start_date)}` : ""}
                      {c.target_date ? ` · Target ${formatDate(c.target_date)}` : ""}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] px-2 py-1 rounded-md",
                      c.status === "active"
                        ? "bg-success/10 text-success"
                        : c.status === "on_hold"
                          ? "bg-warning/15 text-warning"
                          : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                {c.goal && <p className="text-sm text-foreground/80 mt-2">{c.goal}</p>}
                {c.interventions && (
                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">{c.interventions}</p>
                )}
                <div className="mt-3 flex justify-end">
                  <DeleteBtn onClick={() => delPlan.mutate({ id: c.id, patient_id: patientId })} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* Follow-up tasks */}
      <Section
        id="tasks"
        icon={CheckCircle2}
        title="Follow-up tasks"
        description={`${openTasks.length} open · ${tasks.length} total`}
        action={
          <QuickAddDialog
            title="Add follow-up task"
            fields={[
              { key: "title", label: "Title", required: true },
              { key: "description", label: "Description", type: "textarea" },
              { key: "due_date", label: "Due date", type: "date" },
              { key: "priority", label: "Priority", type: "select", options: ["low", "normal", "high", "urgent"] },
            ]}
            onSubmit={(v) => insertTask.mutateAsync({ ...(v as Record<string, unknown>), patient_id: patientId })}
          />
        }
      >
        {tasks.length === 0 ? (
          <Empty text="No follow-up tasks." />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {tasks.map((t) => {
              const done = t.status === "completed";
              return (
                <li key={t.id} className="flex items-start gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => completeTask.mutate({ id: t.id, patient_id: patientId, done: !done })}
                    className="mt-0.5"
                    aria-label={done ? "Reopen task" : "Mark complete"}
                  >
                    {done ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                      {t.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.due_date ? `Due ${formatDate(t.due_date)}` : "No due date"}
                      {t.priority ? ` · ${t.priority}` : ""}
                    </div>
                    {t.description && <p className="text-xs text-foreground/70 mt-1">{t.description}</p>}
                  </div>
                  <DeleteBtn onClick={() => delTask.mutate({ id: t.id, patient_id: patientId })} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Clinical timeline */}
      <Section
        id="clinical-timeline"
        icon={ListChecks}
        title="Clinical timeline"
        description="Unified timeline across problems, procedures, imaging and immunizations."
      >
        <ClinicalTimeline events={clinicalTimeline} />
      </Section>
    </>
  );
}

/* -------------------- Social history sub-section -------------------- */

function SocialHistorySection({
  patientId: _patientId,
  social,
  onSave,
}: {
  patientId: string;
  social: SocialHistory | null;
  onSave: (patch: Partial<SocialHistory>) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<SocialHistory>>({});
  const val = { ...social, ...form };

  const set = <K extends keyof SocialHistory>(k: K, v: SocialHistory[K]) => setForm((s) => ({ ...s, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
    setOpen(false);
    setForm({});
  };

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Smoking", value: social?.smoking_status },
    { label: "Alcohol", value: social?.alcohol_use },
    { label: "Substance use", value: social?.substance_use },
    { label: "Occupation", value: social?.occupation },
    { label: "Marital status", value: social?.marital_status },
    { label: "Living situation", value: social?.living_situation },
    { label: "Exercise", value: social?.exercise },
    { label: "Diet", value: social?.diet },
  ];

  return (
    <Section
      id="social-history"
      icon={Cigarette}
      title="Social history"
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
              <Plus className="size-3" /> Edit
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit social history</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="grid grid-cols-2 gap-3">
              <TextField label="Smoking" value={val.smoking_status ?? ""} onChange={(v) => set("smoking_status", v)} />
              <TextField label="Alcohol" value={val.alcohol_use ?? ""} onChange={(v) => set("alcohol_use", v)} />
              <TextField label="Substance use" value={val.substance_use ?? ""} onChange={(v) => set("substance_use", v)} />
              <TextField label="Occupation" value={val.occupation ?? ""} onChange={(v) => set("occupation", v)} />
              <TextField label="Marital status" value={val.marital_status ?? ""} onChange={(v) => set("marital_status", v)} />
              <TextField label="Living situation" value={val.living_situation ?? ""} onChange={(v) => set("living_situation", v)} />
              <TextField label="Exercise" value={val.exercise ?? ""} onChange={(v) => set("exercise", v)} />
              <TextField label="Diet" value={val.diet ?? ""} onChange={(v) => set("diet", v)} />
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Note</Label>
                <Textarea value={val.note ?? ""} onChange={(e) => set("note", e.target.value)} rows={2} />
              </div>
              <DialogFooter className="col-span-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {!social ? (
        <Empty text="No social history captured. Click Edit to add." />
      ) : (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
          {rows.map((r) => (
            <div key={r.label}>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{r.label}</dt>
              <dd className="text-foreground/85 mt-0.5">{r.value || "—"}</dd>
            </div>
          ))}
          {social.note && (
            <div className="col-span-full">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Note</dt>
              <dd className="text-foreground/85 mt-0.5 whitespace-pre-line">{social.note}</dd>
            </div>
          )}
        </dl>
      )}
    </Section>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}