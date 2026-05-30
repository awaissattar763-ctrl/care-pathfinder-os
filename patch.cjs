const fs = require('fs');
let code = fs.readFileSync('src/routes/patients.$patientId.tsx', 'utf8');

code = code.replace('import { UrgencyBadge } from "@/components/UrgencyBadge";', 
`import { UrgencyBadge, type Urgency } from "@/components/UrgencyBadge";
import { usePatientDetails } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { User2, AlertTriangle, Pill } from "lucide-react";`);

code = code.replace('// ----------------------------- Demo data -----------------------------',
`function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function calcAge(dob: string | null) {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / 3.15576e10);
}

// ----------------------------- Demo data -----------------------------`);

code = code.replace(/\/\/ ----------------------------- Demo data -----------------------------\n[\s\S]*?\/\/ ----------------------------- Subcomponents -----------------------------/, '// ----------------------------- Subcomponents -----------------------------');

const oldFnStart = `function PatientProfilePage() {
  const initials = patient.name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="animate-fade-in-up">`;

const newFnStart = `function PatientProfilePage() {
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

  const { patient, allergies, vitals, soapNotes, prescriptions, appointments, auditLogs, documents } = data;
  
  const initials = patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const insurance = (patient.insurance as any) || { provider: "Unknown", policy: "—", validThrough: "—" };
  const emergency = (patient.emergency_contact as any) || { name: "None", relation: "—", phone: "—" };
  const aiSummary = (patient.ai_summary as any) || { 
    overview: \`\${patient.name} is a \${calcAge(patient.dob)}-year-old \${patient.sex || "patient"}.\`, 
    recommendations: [] 
  };
  const conditions = (patient.conditions || []).map((c: any) => ({ name: c, code: "—", since: "—", status: "Active" }));

  const timeline = [
    ...appointments.map((a: any) => ({ date: a.scheduled_at, type: "Visit", title: a.visit_type, by: a.provider?.name || "Unknown", note: a.reason || a.notes || "" })),
    ...documents.map((d: any) => ({ date: d.uploaded_at, type: d.modality || "Document", title: d.name, by: "System", note: \`Size: \${d.size || "Unknown"}\` })),
    ...soapNotes.map((n: any) => ({ date: n.created_at, type: "Note", title: "SOAP Note", by: n.author, note: n.a || "" })),
    ...prescriptions.map((p: any) => ({ date: p.created_at, type: "Prescription", title: p.drug, by: p.provider?.name || "Unknown", note: p.sig }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const labs = documents.filter((d: any) => d.modality?.toLowerCase().includes("lab") || d.modality?.toLowerCase().includes("blood"));
  const scans = documents.filter((d: any) => !d.modality?.toLowerCase().includes("lab") && !d.modality?.toLowerCase().includes("blood"));

  return (
    <div className="animate-fade-in-up">`;

code = code.replace(oldFnStart, newFnStart);

code = code.replace(/\{patient\.age\}/g, '{calcAge(patient.dob)}');
code = code.replace(/\{patient\.bloodGroup\}/g, '{patient.blood_group || "—"}');
code = code.replace(/\{patient\.primaryCare\}/g, '{patient.primary_care?.name || "Unassigned"}');
code = code.replace(/\{patient\.contact\.phone\}/g, '{patient.phone || "—"}');
code = code.replace(/\{patient\.contact\.email\}/g, '{patient.email || "—"}');
code = code.replace(/\{patient\.contact\.address\}/g, '{patient.address || "—"}');
code = code.replace(/\{patient\.dob\}/g, '{formatDate(patient.dob)}');
code = code.replace(/<UrgencyBadge level="routine">/g, '<UrgencyBadge level={(patient.urgency as Urgency) || "routine"} />');

// AI Summary Fix
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
                {aiSummary.recommendations?.map((r: any, i: number) => (
                   <SuggestionPill key={i} icon={Activity} title={r.title} detail={r.detail} />
                ))}
              </div>`;
code = code.replace(oldAiSummary, newAiSummary);

// Meds fix
code = code.replace(/\{medications\.map/g, '{prescriptions.filter(p => p.status === "Active").map');
code = code.replace(/m\.name/g, 'm.drug');
code = code.replace(/m\.dosage/g, 'm.sig');
code = code.replace(/m\.freq/g, 'm.sig');
code = code.replace(/m\.route/g, 'm.sig');

// Replace {t.date} with {formatDate(t.date)}
code = code.replace(/\{t\.date\}/g, '{formatDate(t.date)}');

fs.writeFileSync('src/routes/patients.$patientId.tsx', code);
console.log('Patched');
