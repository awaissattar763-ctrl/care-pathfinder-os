import { useMemo, useState, type ReactNode } from "react";
import {
  Plus,
  Lock,
  FileSignature,
  CheckCircle2,
  Trash2,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Pill,
  Calendar,
  Printer,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { NewLabOrderDialog } from "@/components/dialogs/NewLabOrderDialog";
import { NewPrescriptionDialog } from "@/components/dialogs/NewPrescriptionDialog";
import { NewAppointmentDialog } from "@/components/dialogs/NewAppointmentDialog";
import {
  ENCOUNTER_STATUSES,
  ENCOUNTER_STATUS_LABEL,
  EXAM_SYSTEMS,
  ROS_SYSTEMS,
  VISIT_TYPES,
  VISIT_TYPE_LABEL,
  useAddDiagnosis,
  useCreateEncounter,
  useEncounterTemplates,
  usePatientEncounters,
  useRemoveDiagnosis,
  useSetEncounterStatus,
  useSignEncounter,
  useUpdateEncounter,
  type EncounterStatus,
  type EncounterTemplate,
  type EncounterWithDx,
} from "@/hooks/queries/encounters";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type JsonMap = Record<string, string>;

function asMap(v: unknown): JsonMap {
  if (!v || typeof v !== "object") return {};
  const out: JsonMap = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string") out[k] = val;
  }
  return out;
}

const STATUS_CLASS: Record<EncounterStatus, string> = {
  scheduled: "bg-secondary text-foreground",
  "checked-in": "bg-primary/10 text-primary",
  "in-progress": "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
};

export function PatientEncountersSection({
  patientId,
  providerId,
}: {
  patientId: string;
  providerId?: string | null;
}) {
  const { data, isLoading } = usePatientEncounters(patientId);
  const list = data ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const open = useMemo(() => list.find((e) => e.id === openId) ?? null, [list, openId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {list.length} encounter{list.length === 1 ? "" : "s"}
        </div>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5"
        >
          <Plus className="size-4" /> New encounter
        </Button>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading…</div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No encounters recorded. Click <span className="text-foreground font-medium">New encounter</span> to
          document a visit.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setOpenId(e.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition text-left"
              >
                <div className="size-9 rounded-md flex items-center justify-center bg-primary/10 text-primary">
                  <Stethoscope className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {VISIT_TYPE_LABEL[e.visit_type] ?? e.visit_type}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold",
                        STATUS_CLASS[(e.status as EncounterStatus) ?? "scheduled"],
                      )}
                    >
                      {ENCOUNTER_STATUS_LABEL[e.status] ?? e.status}
                    </span>
                    {e.locked && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground">
                        <Lock className="size-3" /> Locked
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {formatDateTime(e.encounter_date)}
                    {e.provider?.name ? ` · ${e.provider.name}` : ""}
                    {e.chief_complaint ? ` · ${e.chief_complaint}` : ""}
                  </div>
                </div>
                {e.diagnoses.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {e.diagnoses.length} dx
                  </Badge>
                )}
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <EncounterEditorDialog
          mode="create"
          patientId={patientId}
          providerId={providerId ?? null}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
      {open && (
        <EncounterEditorDialog
          mode="edit"
          patientId={patientId}
          providerId={providerId ?? null}
          encounter={open}
          open={!!open}
          onOpenChange={(o) => !o && setOpenId(null)}
        />
      )}
    </div>
  );
}

/* -------------------- Editor dialog -------------------- */

type EditorProps =
  | {
      mode: "create";
      patientId: string;
      providerId: string | null;
      encounter?: undefined;
      open: boolean;
      onOpenChange: (o: boolean) => void;
    }
  | {
      mode: "edit";
      patientId: string;
      providerId: string | null;
      encounter: EncounterWithDx;
      open: boolean;
      onOpenChange: (o: boolean) => void;
    };

function EncounterEditorDialog(props: EditorProps) {
  const { mode, patientId, providerId, open, onOpenChange } = props;
  const existing = mode === "edit" ? props.encounter : null;
  const locked = existing?.locked ?? false;

  const { data: templates } = useEncounterTemplates();
  const createFn = useCreateEncounter();
  const updateFn = useUpdateEncounter();
  const statusFn = useSetEncounterStatus();
  const signFn = useSignEncounter();
  const addDx = useAddDiagnosis();
  const removeDx = useRemoveDiagnosis();

  const [visitType, setVisitType] = useState<string>(existing?.visit_type ?? "follow-up");
  const [status, setStatus] = useState<EncounterStatus>(
    (existing?.status as EncounterStatus) ?? "scheduled",
  );
  const [chiefComplaint, setChiefComplaint] = useState(existing?.chief_complaint ?? "");
  const [hpi, setHpi] = useState(existing?.hpi ?? "");
  const [ros, setRos] = useState<JsonMap>(asMap(existing?.ros));
  const [exam, setExam] = useState<JsonMap>(asMap(existing?.exam));
  const [assessment, setAssessment] = useState(existing?.assessment ?? "");
  const [plan, setPlan] = useState(existing?.plan ?? "");
  const [followUp, setFollowUp] = useState(existing?.follow_up_instructions ?? "");

  // create-mode diagnoses draft (persisted after encounter is created)
  const [dxDraft, setDxDraft] = useState<{ code: string; description: string; is_primary: boolean }[]>([]);
  const [newDxCode, setNewDxCode] = useState("");
  const [newDxDesc, setNewDxDesc] = useState("");
  const [newDxPrimary, setNewDxPrimary] = useState(false);

  const [savingCreate, setSavingCreate] = useState(false);

  function applyTemplate(t: EncounterTemplate) {
    setVisitType(t.visit_type);
    if (t.chief_complaint) setChiefComplaint(t.chief_complaint);
    if (t.hpi_template) setHpi(t.hpi_template);
    setRos((cur) => ({ ...asMap(t.ros), ...cur }));
    setExam((cur) => ({ ...asMap(t.exam), ...cur }));
    if (t.assessment_template && !assessment) setAssessment(t.assessment_template);
    if (t.plan_template && !plan) setPlan(t.plan_template);
  }

  async function autosaveEdit(patch: Record<string, unknown>) {
    if (mode !== "edit" || locked) return;
    await updateFn.mutateAsync({ id: existing!.id, patient_id: patientId, ...patch });
  }

  async function saveAll() {
    if (mode === "create") {
      setSavingCreate(true);
      try {
        const created = await createFn.mutateAsync({
          patient_id: patientId,
          provider_id: providerId ?? null,
          visit_type: visitType,
          status,
          chief_complaint: chiefComplaint || null,
          hpi: hpi || null,
          ros,
          exam,
          assessment: assessment || null,
          plan: plan || null,
          follow_up_instructions: followUp || null,
        });
        for (const d of dxDraft) {
          await addDx.mutateAsync({
            patient_id: patientId,
            encounter_id: created.id,
            code: d.code || null,
            description: d.description,
            is_primary: d.is_primary,
          });
        }
        onOpenChange(false);
      } finally {
        setSavingCreate(false);
      }
      return;
    }
    await updateFn.mutateAsync({
      id: existing!.id,
      patient_id: patientId,
      visit_type: visitType,
      status,
      chief_complaint: chiefComplaint || null,
      hpi: hpi || null,
      ros,
      exam,
      assessment: assessment || null,
      plan: plan || null,
      follow_up_instructions: followUp || null,
    });
    onOpenChange(false);
  }

  async function onSign() {
    if (mode !== "edit") return;
    await autosaveEdit({
      visit_type: visitType,
      chief_complaint: chiefComplaint || null,
      hpi: hpi || null,
      ros,
      exam,
      assessment: assessment || null,
      plan: plan || null,
      follow_up_instructions: followUp || null,
    });
    await signFn.mutateAsync({ id: existing!.id, patient_id: patientId });
    onOpenChange(false);
  }

  async function onStatusChange(next: EncounterStatus) {
    setStatus(next);
    if (mode === "edit" && !locked) {
      await statusFn.mutateAsync({ id: existing!.id, patient_id: patientId, status: next });
    }
  }

  function addLocalDx() {
    if (!newDxDesc.trim()) return;
    if (mode === "create") {
      setDxDraft((cur) => [
        ...cur,
        { code: newDxCode.trim(), description: newDxDesc.trim(), is_primary: newDxPrimary },
      ]);
    } else if (!locked) {
      addDx.mutate({
        patient_id: patientId,
        encounter_id: existing!.id,
        code: newDxCode.trim() || null,
        description: newDxDesc.trim(),
        is_primary: newDxPrimary,
      });
    }
    setNewDxCode("");
    setNewDxDesc("");
    setNewDxPrimary(false);
  }

  const displayedDx =
    mode === "edit"
      ? existing!.diagnoses.map((d) => ({
          id: d.id,
          code: d.code ?? "",
          description: d.description,
          is_primary: d.is_primary,
        }))
      : dxDraft.map((d, i) => ({ id: `draft-${i}`, ...d }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="size-5 text-primary" />
            {mode === "create" ? "New encounter" : `Encounter · ${VISIT_TYPE_LABEL[existing!.visit_type] ?? existing!.visit_type}`}
            {locked && (
              <span className="inline-flex items-center gap-1 text-[11px] uppercase font-semibold text-muted-foreground ml-2">
                <Lock className="size-3" /> Locked
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Header controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Visit type</Label>
            <Select
              value={visitType}
              onValueChange={(v) => {
                setVisitType(v);
                if (mode === "edit" && !locked) void autosaveEdit({ visit_type: v });
              }}
              disabled={locked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {VISIT_TYPE_LABEL[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => onStatusChange(v as EncounterStatus)} disabled={locked}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENCOUNTER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ENCOUNTER_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Template</Label>
            <Select
              onValueChange={(id) => {
                const t = templates?.find((x) => x.id === id);
                if (t) applyTemplate(t);
              }}
              disabled={locked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Apply template…" />
              </SelectTrigger>
              <SelectContent>
                {(templates ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="subjective" className="mt-3">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="subjective">Subjective</TabsTrigger>
            <TabsTrigger value="ros">ROS</TabsTrigger>
            <TabsTrigger value="exam">Exam</TabsTrigger>
            <TabsTrigger value="ap">Assessment/Plan</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="avs">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="subjective" className="space-y-4 pt-3">
            <div>
              <Label className="text-xs">Chief complaint</Label>
              <Input
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Reason for visit"
                disabled={locked}
              />
            </div>
            <div>
              <Label className="text-xs">History of Present Illness (HPI)</Label>
              <Textarea
                value={hpi}
                onChange={(e) => setHpi(e.target.value)}
                placeholder="Onset, location, duration, characterization, aggravating/relieving factors, timing, severity…"
                rows={8}
                disabled={locked}
              />
            </div>
          </TabsContent>

          <TabsContent value="ros" className="pt-3">
            <SystemMap
              systems={ROS_SYSTEMS as readonly string[]}
              value={ros}
              onChange={setRos}
              disabled={locked}
              placeholder="Normal / patient reports…"
            />
          </TabsContent>

          <TabsContent value="exam" className="pt-3">
            <SystemMap
              systems={EXAM_SYSTEMS as readonly string[]}
              value={exam}
              onChange={setExam}
              disabled={locked}
              placeholder="Findings…"
            />
          </TabsContent>

          <TabsContent value="ap" className="space-y-4 pt-3">
            <div>
              <Label className="text-xs">Assessment</Label>
              <Textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                rows={4}
                placeholder="Clinical impression"
                disabled={locked}
              />
            </div>

            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Diagnoses</div>
              </div>
              {displayedDx.length === 0 ? (
                <div className="text-xs text-muted-foreground">No diagnoses added.</div>
              ) : (
                <ul className="space-y-1.5">
                  {displayedDx.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-2 rounded-md bg-secondary/40 px-2 py-1.5"
                    >
                      {d.is_primary && (
                        <Badge variant="default" className="text-[10px]">
                          Primary
                        </Badge>
                      )}
                      {d.code && (
                        <span className="text-xs font-mono text-muted-foreground">{d.code}</span>
                      )}
                      <span className="text-sm flex-1">{d.description}</span>
                      {!locked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            if (mode === "create") {
                              setDxDraft((cur) =>
                                cur.filter((_, i) => `draft-${i}` !== d.id),
                              );
                            } else {
                              removeDx.mutate({
                                id: d.id,
                                patient_id: patientId,
                                encounter_id: existing!.id,
                              });
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!locked && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-[120px_1fr_auto_auto] gap-2 items-end">
                  <div>
                    <Label className="text-xs">ICD code</Label>
                    <Input
                      value={newDxCode}
                      onChange={(e) => setNewDxCode(e.target.value)}
                      placeholder="E11.9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={newDxDesc}
                      onChange={(e) => setNewDxDesc(e.target.value)}
                      placeholder="Type 2 diabetes without complications"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs pb-2">
                    <Checkbox
                      checked={newDxPrimary}
                      onCheckedChange={(v) => setNewDxPrimary(!!v)}
                    />
                    Primary
                  </label>
                  <Button type="button" size="sm" onClick={addLocalDx}>
                    <Plus className="size-4" /> Add
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">Treatment Plan</Label>
              <Textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={5}
                placeholder="Meds, procedures, patient education, referrals…"
                disabled={locked}
              />
            </div>
            <div>
              <Label className="text-xs">Follow-up instructions</Label>
              <Textarea
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                rows={3}
                placeholder="Return precautions, next visit, home care…"
                disabled={locked}
              />
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              Generate orders directly from this encounter. Each opens the standard order dialog
              pre-filled with this patient.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NewLabOrderDialog
                defaultPatientId={patientId}
                trigger={
                  <OrderTile icon={<FlaskConical className="size-4" />} title="Lab order" desc="Blood work, panels, cultures" />
                }
              />
              <NewPrescriptionDialog
                defaultPatientId={patientId}
                trigger={
                  <OrderTile icon={<Pill className="size-4" />} title="Prescription" desc="e-Prescribe medications" />
                }
              />
              <NewAppointmentDialog
                trigger={
                  <OrderTile icon={<Calendar className="size-4" />} title="Follow-up appointment" desc="Schedule next visit" />
                }
              />
              <OrderTile
                icon={<ClipboardList className="size-4" />}
                title="Imaging / Referral"
                desc="Track via Imaging & Care Plans"
                asButton
                onClick={() => {
                  const el = document.getElementById("imaging-history");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="avs" className="pt-3">
            <AfterVisitSummary
              encounter={{
                visit_type: visitType,
                encounter_date: existing?.encounter_date ?? new Date().toISOString(),
                chief_complaint: chiefComplaint,
                assessment,
                plan,
                follow_up_instructions: followUp,
              }}
              diagnoses={displayedDx}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:justify-between flex-wrap">
          <div className="text-xs text-muted-foreground">
            {existing?.signed_at ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-success" /> Signed{" "}
                {formatDateTime(existing.signed_at)}
              </span>
            ) : (
              <span>Unsigned draft</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {!locked && (
              <Button
                variant="outline"
                onClick={saveAll}
                disabled={savingCreate || createFn.isPending || updateFn.isPending}
              >
                {savingCreate || createFn.isPending || updateFn.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {mode === "create" ? "Save encounter" : "Save changes"}
              </Button>
            )}
            {mode === "edit" && !locked && (
              <Button onClick={onSign} disabled={signFn.isPending} className="inline-flex items-center gap-1.5">
                <FileSignature className="size-4" /> Sign & lock
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrderTile({
  icon,
  title,
  desc,
  asButton,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  asButton?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-secondary/50 transition cursor-pointer text-left w-full">
      <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </div>
  );
  if (asButton)
    return (
      <button type="button" onClick={onClick}>
        {inner}
      </button>
    );
  return <button type="button">{inner}</button>;
}

function SystemMap({
  systems,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  systems: readonly string[];
  value: JsonMap;
  onChange: (next: JsonMap) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {systems.map((s) => (
        <div key={s}>
          <Label className="text-xs">{s}</Label>
          <Textarea
            value={value[s] ?? ""}
            onChange={(e) => onChange({ ...value, [s]: e.target.value })}
            placeholder={placeholder}
            rows={2}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}

function AfterVisitSummary({
  encounter,
  diagnoses,
}: {
  encounter: {
    visit_type: string;
    encounter_date: string;
    chief_complaint: string;
    assessment: string;
    plan: string;
    follow_up_instructions: string;
  };
  diagnoses: { code: string; description: string; is_primary: boolean }[];
}) {
  return (
    <div className="rounded-lg border border-border p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">After Visit Summary</div>
          <div className="text-xs text-muted-foreground">
            {VISIT_TYPE_LABEL[encounter.visit_type] ?? encounter.visit_type} ·{" "}
            {formatDateTime(encounter.encounter_date)}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Print
        </Button>
      </div>
      <AvsBlock title="Reason for visit" body={encounter.chief_complaint || "—"} />
      <AvsBlock
        title="Diagnoses"
        body={
          diagnoses.length === 0
            ? "None recorded"
            : diagnoses
                .map((d) => `${d.is_primary ? "★ " : ""}${d.code ? `${d.code} · ` : ""}${d.description}`)
                .join("\n")
        }
      />
      <AvsBlock title="Assessment" body={encounter.assessment || "—"} />
      <AvsBlock title="Treatment plan" body={encounter.plan || "—"} />
      <AvsBlock title="Follow-up instructions" body={encounter.follow_up_instructions || "—"} />
      <p className="text-[11px] text-muted-foreground mt-3">
        Contact your care team if symptoms worsen. This summary is part of your medical record.
      </p>
    </div>
  );
}

function AvsBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-2 border-t border-border first:border-t-0">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {title}
      </div>
      <div className="text-sm whitespace-pre-wrap mt-0.5">{body}</div>
    </div>
  );
}
