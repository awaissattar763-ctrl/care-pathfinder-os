import fs from 'fs';

let code = fs.readFileSync('src/routes/patients.$patientId.tsx', 'utf8');

// 1. Add new imports and helpers
code = code.replace('import { UrgencyBadge } from "@/components/UrgencyBadge";', 
`import { UrgencyBadge, type Urgency } from "@/components/UrgencyBadge";
import { usePatientDetails } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { User2 } from "lucide-react";`);

code = code.replace('// ----------------------------- Demo data -----------------------------',
`function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function calcAge(dob) {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / 3.15576e10);
}

// ----------------------------- Demo data -----------------------------`);

// 2. Remove demo data completely
const startMarker = '// ----------------------------- Demo data -----------------------------';
const endMarker = '// ----------------------------- Subcomponents -----------------------------';
const firstStart = code.indexOf(startMarker, code.indexOf(startMarker) + 1); // skip the one we just added
const endIdx = code.indexOf(endMarker);
if (firstStart !== -1 && endIdx !== -1) {
  code = code.substring(0, firstStart) + '\\n' + code.substring(endIdx);
}

// 3. Inject data mapper into PatientProfilePage
const pageStart = `function PatientProfilePage() {`;
const newPageStart = `function PatientProfilePage() {
  const { patientId } = Route.useParams();
  const { data, isLoading } = usePatientDetails(patientId);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-start gap-6">
          <Skeleton className="size-20 rounded-2xl" />
          <Skeleton className="h-24 flex-1" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <Skeleton className="h-64 hidden lg:block" />
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="p-8">
        <EmptyState icon={User2} title="Patient not found" description="The requested patient record could not be found." />
      </div>
    );
  }

  const p = data.patient;
  const patient = {
    id: p.id,
    name: p.name,
    pronouns: p.sex === 'Male' ? 'he/him' : p.sex === 'Female' ? 'she/her' : 'they/them',
    dob: p.dob || "",
    age: calcAge(p.dob),
    sex: p.sex || "",
    bloodGroup: p.blood_group || "—",
    mrn: p.mrn,
    primaryCare: p.primary_care?.name || "Unassigned",
    insurance: (p.insurance) || { provider: "Unknown", policy: "—", group: "—", validThrough: "—" },
    contact: { phone: p.phone || "—", email: p.email || "—", address: p.address || "—" },
    emergency: (p.emergency_contact) || { name: "None", relation: "—", phone: "—" },
    flags: p.flags || [],
    riskScore: p.risk_score || 0,
    urgency: p.urgency
  };

  const conditions = (p.conditions || []).map((c) => ({
    name: c, code: "—", since: "—", status: "Active"
  }));

  const allergies = data.allergies.map((a) => ({
    allergen: a.name, reaction: a.reaction, severity: a.severity
  }));

  const vitals = data.vitals.map((v) => ({
    label: v.label, value: v.value, unit: v.unit, trend: v.trend, measuredAt: formatDate(v.measured_at), series: (v.series) || [60,65,62]
  }));

  const timeline = [
    ...data.appointments.map((a) => ({ date: a.scheduled_at, type: "Visit", title: a.visit_type, by: a.provider?.name || "Unknown", note: a.reason || a.notes || "" })),
    ...data.documents.map((d) => ({ date: d.uploaded_at, type: d.modality || "Document", title: d.name, by: "System", note: \`Size: \${d.size || "Unknown"}\` })),
    ...data.soapNotes.map((n) => ({ date: n.created_at, type: "Note", title: "SOAP Note", by: n.author, note: n.a || "" })),
    ...data.prescriptions.map((pr) => ({ date: pr.created_at, type: "Prescription", title: pr.drug, by: pr.provider?.name || "Unknown", note: pr.sig }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .map((t) => ({ ...t, date: formatDate(t.date) }))
   .slice(0, 10);

  const soapNotes = data.soapNotes.map((n) => ({
    date: formatDate(n.date), author: n.author, s: n.s, o: n.o, a: n.a, p: n.p
  }));

  const medications = data.prescriptions.map((pr) => ({
    rx: pr.rx_number, name: pr.drug, dose: pr.sig, freq: "", route: "", started: formatDate(pr.created_at), prescriber: pr.provider?.name || "Unknown", status: pr.status
  }));

  const auditTrail = data.auditLogs.map((al) => ({
    date: formatDateTime(al.created_at), action: al.action, user: "System/User", details: JSON.stringify(al.metadata)
  }));

  const docs = data.documents;
  const labs = docs.filter((d) => d.modality?.toLowerCase().includes("lab") || d.modality?.toLowerCase().includes("blood")).map((d) => ({
    date: formatDate(d.date), test: d.name, result: "View", flag: "", trend: "stable"
  }));
  const scans = docs.filter((d) => !d.modality?.toLowerCase().includes("lab") && !d.modality?.toLowerCase().includes("blood")).map((d) => ({
    date: formatDate(d.date), modality: d.modality || "Scan", bodyPart: d.name, finding: "View report"
  }));
  const aiSummary = (p.ai_summary) || { overview: \`Patient \${p.name}.\`, recommendations: [] };

`;
code = code.replace(pageStart, newPageStart);

// 4. Update the urgency badge since urgency typing was changed.
code = code.replace(/<UrgencyBadge level="routine">/g, '<UrgencyBadge level={(patient.urgency as Urgency) || "routine"}>');

// 5. Update AI Summary JSX
const oldAiSummary = `<p className="text-sm leading-relaxed text-foreground/90">
                <span className="font-medium">{patient.name}</span> is a 42-year-old female with a history of <span className="font-medium">essential hypertension</span> (well-controlled on Lisinopril 10 mg) and <span className="font-medium">mild persistent asthma</span>. Recent labs show <span className="font-medium text-warning">borderline elevated LDL (118 mg/dL)</span>; lipid follow-up recommended in 6 months. Blood pressure has trended down over the past 90 days. No acute concerns documented at last encounter.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                <SuggestionPill icon={Activity} title="Lifestyle counseling" detail="Reinforce DASH-style diet & 150 min/wk aerobic." />
                <SuggestionPill icon={FlaskConical} title="Repeat lipid panel" detail="Schedule for Oct 2026." />
                <SuggestionPill icon={Calendar} title="3-mo BP recheck" detail="Auto-book Jun 12 at 09:30 confirmed." />
              </div>`;
              
const newAiSummary = `<p className="text-sm leading-relaxed text-foreground/90">
                {aiSummary.overview}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                {aiSummary.recommendations?.map((r, i) => (
                   <SuggestionPill key={i} icon={Activity} title={r.title} detail={r.detail} />
                ))}
              </div>`;
code = code.replace(oldAiSummary, newAiSummary);

// 6. Update the "Assistant Only" label text since there's already a requirement:
// "Clearly label: 'Assistant Only — Requires Clinical Review'"
// Let's add it right under the AI Clinical Summary title if not present.
code = code.replace(
  '<div className="flex items-center gap-2">\\n              <Sparkles className="size-4 text-primary" />\\n              <h3 className="font-semibold text-foreground">AI Clinical Summary</h3>\\n            </div>',
  `<div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-semibold text-foreground">AI Clinical Summary</h3>
              <span className="ml-2 text-[10px] uppercase font-bold text-warning border border-warning/30 bg-warning/10 px-2 py-0.5 rounded-full">Assistant Only — Requires Clinical Review</span>
            </div>`
);

fs.writeFileSync('src/routes/patients.$patientId.tsx', code);
console.log('Fixed properly');
