import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Shield,
  Lock,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Pill,
  HeartPulse,
  FileText,
  ImageIcon,
  ClipboardList,
  Calendar,
  Sparkles,
  Download,
  Eye,
  ChevronRight,
  Droplet,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Clock,
  User2,
  History,
  FlaskConical,
  FileSignature,
  Plus,
} from "lucide-react";
import { UrgencyBadge, type Urgency } from "@/components/UrgencyBadge";
import { usePatientDetails } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients/$patientId")({
  component: PatientProfilePage,
});

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function calcAge(dob: string | null | undefined) {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / 3.15576e10);
}

// ----------------------------- Demo data -----------------------------
const patient = {
  id: "P-10234",
  name: "Maya Chen",
  pronouns: "she/her",
  dob: "March 14, 1984",
  age: 42,
  sex: "Female",
  bloodGroup: "A+",
  mrn: "MRN-884127",
  primaryCare: "Dr. Adaeze Okafor, MD",
  insurance: { provider: "Aetna PPO", policy: "AET-553-2098-44", group: "G-77821", validThrough: "Dec 2026" },
  contact: { phone: "+1 (415) 555-0184", email: "maya.chen@example.com", address: "1280 Sutter St, Apt 4B, San Francisco, CA" },
  emergency: { name: "Wei Chen", relation: "Spouse", phone: "+1 (415) 555-0190" },
  flags: ["Asthma action plan on file", "Prefers AM appointments"],
  riskScore: 38,
};

const allergies = [
  { name: "Penicillin", reaction: "Anaphylaxis", severity: "severe" },
  { name: "Peanuts", reaction: "Hives, swelling", severity: "moderate" },
  { name: "Latex", reaction: "Contact dermatitis", severity: "mild" },
];

const conditions = [
  { name: "Essential hypertension", code: "I10", since: "2019", status: "Active" },
  { name: "Mild persistent asthma", code: "J45.30", since: "2008", status: "Controlled" },
  { name: "Vitamin D deficiency", code: "E55.9", since: "2023", status: "Monitoring" },
];

const medications = [
  { name: "Lisinopril", dose: "10 mg", freq: "1× daily", started: "Jan 2022", prescriber: "Dr. Okafor", refills: 3 },
  { name: "Albuterol HFA", dose: "90 mcg", freq: "PRN, 2 puffs", started: "Mar 2008", prescriber: "Dr. Mendez", refills: 5 },
  { name: "Cholecalciferol", dose: "2000 IU", freq: "1× daily", started: "Aug 2023", prescriber: "Dr. Okafor", refills: 11 },
  { name: "Loratadine", dose: "10 mg", freq: "PRN, seasonal", started: "Apr 2021", prescriber: "Dr. Okafor", refills: 2 },
];

const vitals = [
  { label: "Blood pressure", value: "128 / 82", unit: "mmHg", trend: "down", series: [142, 138, 136, 134, 130, 132, 128] },
  { label: "Resting HR", value: "72", unit: "bpm", trend: "down", series: [78, 80, 76, 74, 73, 74, 72] },
  { label: "SpO₂", value: "98", unit: "%", trend: "flat", series: [97, 98, 97, 98, 98, 97, 98] },
  { label: "BMI", value: "23.4", unit: "kg/m²", trend: "up", series: [22.8, 22.9, 23.0, 23.1, 23.2, 23.3, 23.4] },
];

const timeline = [
  { date: "May 18, 2026", type: "Visit", title: "Annual physical", by: "Dr. Okafor", note: "Routine wellness exam. Labs ordered." },
  { date: "Apr 02, 2026", type: "Lab", title: "Lipid panel", by: "Quest Diagnostics", note: "LDL 118 mg/dL — borderline. Repeat in 6 mo." },
  { date: "Feb 14, 2026", type: "Telehealth", title: "Asthma follow-up", by: "Dr. Mendez", note: "Symptoms stable on current regimen." },
  { date: "Nov 22, 2025", type: "Imaging", title: "Chest X-ray PA/Lat", by: "SF Radiology", note: "No acute cardiopulmonary findings." },
  { date: "Sep 09, 2025", type: "Visit", title: "BP recheck", by: "Dr. Okafor", note: "Lisinopril titrated to 10 mg." },
];

const labs = [
  { name: "Comprehensive Metabolic Panel", date: "Apr 02, 2026", status: "Final", flagged: false, size: "184 KB" },
  { name: "Lipid Panel", date: "Apr 02, 2026", status: "Final", flagged: true, size: "92 KB" },
  { name: "HbA1c", date: "Apr 02, 2026", status: "Final", flagged: false, size: "48 KB" },
  { name: "CBC w/ Differential", date: "Jan 11, 2026", status: "Final", flagged: false, size: "112 KB" },
];

const scans = [
  { name: "Chest X-ray PA/Lat", modality: "X-Ray", date: "Nov 22, 2025", size: "4.2 MB" },
  { name: "Pulmonary function test", modality: "PFT", date: "Feb 14, 2026", size: "1.1 MB" },
  { name: "ECG 12-lead", modality: "ECG", date: "May 18, 2026", size: "320 KB" },
];

const soapNotes = [
  {
    date: "May 18, 2026",
    author: "Dr. Adaeze Okafor",
    s: "Patient reports feeling well overall. Occasional morning headaches, no chest pain, no SOB. Sleep 6–7 hr.",
    o: "BP 128/82, HR 72, SpO₂ 98%. Lungs clear bilaterally. No peripheral edema.",
    a: "Hypertension — controlled. Asthma — stable. Vitamin D — repleting.",
    p: "Continue Lisinopril 10 mg. Recheck BP in 3 months. Repeat lipid panel in 6 months.",
  },
  {
    date: "Feb 14, 2026",
    author: "Dr. Luis Mendez",
    s: "No nocturnal symptoms. Uses rescue inhaler ~1×/week during pollen exposure.",
    o: "Peak flow 92% of personal best. Auscultation clear.",
    a: "Mild persistent asthma — well controlled.",
    p: "Continue current regimen. Reinforce trigger avoidance.",
  },
];

const prescriptions = [
  { rx: "RX-220914", drug: "Lisinopril 10 mg", date: "May 18, 2026", prescriber: "Dr. Okafor", status: "Active" },
  { rx: "RX-220801", drug: "Cholecalciferol 2000 IU", date: "Apr 02, 2026", prescriber: "Dr. Okafor", status: "Active" },
  { rx: "RX-219455", drug: "Albuterol HFA 90 mcg", date: "Feb 14, 2026", prescriber: "Dr. Mendez", status: "Active" },
  { rx: "RX-218110", drug: "Amoxicillin 500 mg", date: "Oct 11, 2025", prescriber: "Dr. Okafor", status: "Completed" },
];

const appointments = [
  { date: "Jun 12, 2026 · 09:30", type: "BP recheck", with: "Dr. Okafor", status: "Upcoming" },
  { date: "May 18, 2026 · 10:00", type: "Annual physical", with: "Dr. Okafor", status: "Completed" },
  { date: "Feb 14, 2026 · 14:15", type: "Asthma follow-up", with: "Dr. Mendez", status: "Completed" },
  { date: "Sep 09, 2025 · 11:00", type: "BP recheck", with: "Dr. Okafor", status: "Completed" },
];

const auditTrail = [
  { who: "Dr. Adaeze Okafor", role: "Primary care", action: "Viewed chart", when: "Today · 09:14" },
  { who: "Nurse R. Patel", role: "RN", action: "Updated vitals", when: "Today · 09:02" },
  { who: "Billing · S. Ahmed", role: "Admin", action: "Accessed insurance", when: "Yesterday · 16:48" },
  { who: "Dr. Luis Mendez", role: "Pulmonology", action: "Viewed PFT report", when: "May 21 · 11:20" },
];

// ----------------------------- Subcomponents -----------------------------

const sections = [
  { id: "overview", label: "Overview", icon: User2 },
  { id: "summary", label: "AI Summary", icon: Sparkles },
  { id: "allergies", label: "Allergies & Conditions", icon: AlertTriangle },
  { id: "medications", label: "Medications", icon: Pill },
  { id: "vitals", label: "Vitals", icon: HeartPulse },
  { id: "timeline", label: "Medical timeline", icon: History },
  { id: "labs", label: "Lab reports", icon: FlaskConical },
  { id: "scans", label: "Scans & documents", icon: ImageIcon },
  { id: "soap", label: "SOAP notes", icon: ClipboardList },
  { id: "rx", label: "Prescriptions", icon: FileSignature },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "audit", label: "Audit access", icon: ShieldCheck },
];

function SectionCard({
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

const severityStyles: Record<string, string> = {
  severe: "bg-destructive/10 text-destructive border-destructive/20",
  moderate: "bg-warning/15 text-warning border-warning/30",
  mild: "bg-success/10 text-success border-success/20",
};

function Sparkline({ data, accent = "var(--primary)" }: { data: number[]; accent?: string }) {
  const w = 120;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  const gradId = `g-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={w} height={h} className="block">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="size-3.5 text-warning" />;
  if (trend === "down") return <TrendingDown className="size-3.5 text-success" />;
  return <Activity className="size-3.5 text-muted-foreground" />;
}

// ----------------------------- Page -----------------------------

function PatientProfilePage() {
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
    insurance: ((p.insurance as any) || { provider: "Unknown", policy: "—", group: "—", validThrough: "—" }),
    contact: { phone: p.phone || "—", email: p.email || "—", address: p.address || "—" },
    emergency: ((p.emergency_contact as any) || { name: "None", relation: "—", phone: "—" }),
    flags: p.flags || [],
    riskScore: p.risk_score || 0,
    urgency: p.urgency
  };

  const conditions = (p.conditions || []).map((c: any) => ({
    name: c, code: "—", since: "—", status: "Active"
  }));

  const allergies = data.allergies.map((a: any) => ({
    name: a.name, allergen: a.name, reaction: a.reaction || "—", severity: a.severity || "mild"
  }));

  const vitals = data.vitals.map((v: any) => ({
    label: v.label, value: v.value, unit: v.unit, trend: v.trend as any, measuredAt: formatDate(v.measured_at), series: (v.series as number[]) || [60,65,62]
  }));

  const timeline = [
    ...data.appointments.map((a: any) => ({ date: a.scheduled_at, type: "Visit", title: a.visit_type, by: a.provider?.name || "Unknown", note: a.reason || a.notes || "" })),
    ...data.documents.map((d: any) => ({ date: d.uploaded_at, type: d.modality || "Document", title: d.name, by: "System", note: `Size: ${d.size || "Unknown"}` })),
    ...data.soapNotes.map((n: any) => ({ date: n.created_at, type: "Note", title: "SOAP Note", by: n.author, note: n.a || "" })),
    ...data.prescriptions.map((pr: any) => ({ date: pr.created_at, type: "Prescription", title: pr.drug, by: pr.provider?.name || "Unknown", note: pr.sig }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .map((t: any) => ({ ...t, date: formatDate(t.date) }))
   .slice(0, 10);

  const soapNotes = data.soapNotes.map((n: any) => ({
    date: formatDate(n.date), author: n.author, s: n.s || "", o: n.o || "", a: n.a || "", p: n.p || ""
  }));

  const medications = data.prescriptions.map((pr: any) => ({
    rx: pr.rx_number, name: pr.drug, dose: pr.sig, freq: "—", route: "—", started: formatDate(pr.created_at), prescriber: pr.provider?.name || "Unknown", status: pr.status || "Active", refills: 0
  }));

  const auditTrail = data.auditLogs.map((al: any) => ({
    date: formatDateTime(al.created_at), when: formatDateTime(al.created_at), action: al.action, user: "System/User", who: "System/User", role: "System", details: JSON.stringify(al.metadata)
  }));

  const docs = data.documents;
  const labs = docs.filter((d: any) => d.modality?.toLowerCase().includes("lab") || d.modality?.toLowerCase().includes("blood")).map((d: any) => ({
    date: formatDate(d.date), test: d.name, result: "View", flag: "", trend: "stable", name: d.name, flagged: false, status: "Final", size: "1 MB"
  }));
  const scans = docs.filter((d: any) => !d.modality?.toLowerCase().includes("lab") && !d.modality?.toLowerCase().includes("blood")).map((d: any) => ({
    date: formatDate(d.date), modality: d.modality || "Scan", bodyPart: d.name, finding: "View report", name: d.name, size: "5 MB"
  }));
  const aiSummary = (p.ai_summary as any) || { overview: `Patient ${p.name}.`, recommendations: [] };


  const initials = patient.name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="animate-fade-in-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/patients" className="inline-flex items-center gap-1 hover:text-primary">
          <ArrowLeft className="size-3.5" /> Patients
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground/80">{patient.name}</span>
        <span className="text-muted-foreground/60">·</span>
        <span className="tabular-nums">{patient.id}</span>
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          <Lock className="size-3" /> PHI
        </span>
      </div>

      {/* Patient overview header */}
      <div
        className="rounded-xl border border-border overflow-hidden mb-6"
        style={{ background: "var(--gradient-soft)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-7 flex flex-wrap items-start gap-6">
          <div className="size-20 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-2xl font-semibold ring-4 ring-card">
            {initials}
          </div>
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{patient.name}</h1>
              <span className="text-sm text-muted-foreground">({patient.pronouns})</span>
              <UrgencyBadge level={(patient.urgency as Urgency) || "routine"}>Stable</UrgencyBadge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
              <span><span className="text-foreground font-medium">{patient.age}</span> yrs · {patient.sex}</span>
              <span className="inline-flex items-center gap-1.5"><Droplet className="size-3.5 text-destructive" /> Blood group <span className="text-foreground font-medium">{patient.bloodGroup}</span></span>
              <span>DOB {patient.dob}</span>
              <span>MRN <span className="tabular-nums text-foreground/80">{patient.mrn}</span></span>
              <span className="inline-flex items-center gap-1.5"><Stethoscope className="size-3.5" /> {patient.primaryCare}</span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoTile icon={Shield} label="Insurance" title={patient.insurance.provider} sub={`Policy ${patient.insurance.policy} · valid ${patient.insurance.validThrough}`} />
              <InfoTile icon={Phone} label="Emergency contact" title={patient.emergency.name} sub={`${patient.emergency.relation} · ${patient.emergency.phone}`} />
              <InfoTile icon={Mail} label="Contact" title={patient.contact.phone} sub={patient.contact.email} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Plus className="size-4" /> New encounter
            </button>
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary">
              <Calendar className="size-4" /> Book visit
            </button>
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground">
              <Download className="size-3.5" /> Export chart
            </button>
          </div>
        </div>
        <div className="px-7 py-3 border-t border-border bg-card/40 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {patient.contact.address}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" /> Last updated 4 min ago</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-success" /> HIPAA-compliant access</span>
          {patient.flags.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 text-foreground/70">
              <span className="size-1.5 rounded-full bg-primary" /> {f}
            </span>
          ))}
        </div>
      </div>

      {/* Layout: sticky side nav + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 rounded-xl border border-border bg-card p-2" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="px-3 py-2 label-eyebrow">Jump to</div>
            <ul className="space-y-0.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
                  >
                    <s.icon className="size-4" />
                    <span>{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-2 mx-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <Lock className="size-3" /> Protected health information
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                All access is logged. Use of this record is monitored per HIPAA §164.312.
              </p>
            </div>
          </nav>
        </aside>

        <div className="space-y-6 min-w-0">
          {/* Overview / risk indicators */}
          <SectionCard id="overview" icon={Activity} title="Clinical overview" description="Snapshot of current risk indicators and active issues.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <RiskTile label="Cardiovascular" value="Moderate" level="moderate" detail="LDL 118 · BP trending down" />
              <RiskTile label="Respiratory" value="Low" level="low" detail="Asthma controlled" />
              <RiskTile label="Metabolic" value="Low" level="low" detail="HbA1c 5.4%" />
              <RiskTile label="Medication adherence" value="92%" level="good" detail="Refill on time" />
            </div>
          </SectionCard>

          {/* AI Summary */}
          <SectionCard
            id="summary"
            icon={Sparkles}
            title="AI-generated medical summary"
            description="Assistive only — clinician must verify before acting."
            action={
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                <Sparkles className="size-3" /> Generated 4 min ago
              </span>
            }
          >
            <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-5">
              <p className="text-sm leading-relaxed text-foreground/90">
                <span className="font-medium">{patient.name}</span> is a 42-year-old female with a history of <span className="font-medium">essential hypertension</span> (well-controlled on Lisinopril 10 mg) and <span className="font-medium">mild persistent asthma</span>. Recent labs show <span className="font-medium text-warning">borderline elevated LDL (118 mg/dL)</span>; lipid follow-up recommended in 6 months. Blood pressure has trended down over the past 90 days. No acute concerns documented at last encounter.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                <SuggestionPill icon={Activity} title="Lifestyle counseling" detail="Reinforce DASH-style diet & 150 min/wk aerobic." />
                <SuggestionPill icon={FlaskConical} title="Repeat lipid panel" detail="Schedule for Oct 2026." />
                <SuggestionPill icon={Calendar} title="3-mo BP recheck" detail="Auto-book Jun 12 at 09:30 confirmed." />
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
                <Shield className="size-3" /> Summary generated from this patient's de-identified longitudinal record. Source citations available on hover in chart view.
              </p>
            </div>
          </SectionCard>

          {/* Allergies & Conditions */}
          <SectionCard id="allergies" icon={AlertTriangle} title="Allergies & chronic conditions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="label-eyebrow mb-3">Allergies ({allergies.length})</div>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {allergies.map((a) => (
                    <li key={a.name} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.reaction}</div>
                      </div>
                      <span className={cn("text-[11px] font-medium uppercase tracking-wider px-2 py-1 rounded-md border", severityStyles[a.severity])}>
                        {a.severity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="label-eyebrow mb-3">Chronic conditions ({conditions.length})</div>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {conditions.map((c) => (
                    <li key={c.name} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">ICD-10 {c.code} · since {c.since}</div>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                        {c.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* Medications */}
          <SectionCard id="medications" icon={Pill} title="Active medications" description="Reconciled at last visit on May 18, 2026.">
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Medication</th>
                    <th className="text-left font-semibold px-4 py-3">Dose</th>
                    <th className="text-left font-semibold px-4 py-3">Frequency</th>
                    <th className="text-left font-semibold px-4 py-3">Started</th>
                    <th className="text-left font-semibold px-4 py-3">Prescriber</th>
                    <th className="text-left font-semibold px-4 py-3">Refills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {medications.map((m) => (
                    <tr key={m.name} className="hover:bg-secondary/40 transition">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{m.dose}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.freq}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.started}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.prescriber}</td>
                      <td className="px-4 py-3 tabular-nums">{m.refills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Vitals */}
          <SectionCard id="vitals" icon={HeartPulse} title="Vitals history" description="Last 7 measurements.">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {vitals.map((v) => (
                <div key={v.label} className="rounded-lg border border-border p-4 bg-card card-hover">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{v.label}</div>
                    <TrendIcon trend={v.trend} />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">{v.value}</span>
                    <span className="text-xs text-muted-foreground">{v.unit}</span>
                  </div>
                  <div className="mt-3"><Sparkline data={v.series} /></div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Timeline */}
          <SectionCard id="timeline" icon={History} title="Medical timeline">
            <ol className="relative border-l border-border ml-2 space-y-5">
              {timeline.map((t, i) => (
                <li key={i} className="pl-5 relative">
                  <span className="absolute -left-1.5 top-1.5 size-3 rounded-full bg-card border-2 border-primary" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums">{t.date}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{t.type}</span>
                  </div>
                  <div className="text-sm font-medium mt-0.5">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.by} — {t.note}</div>
                </li>
              ))}
            </ol>
          </SectionCard>

          {/* Labs */}
          <SectionCard id="labs" icon={FlaskConical} title="Lab reports" action={<button className="text-xs text-primary font-medium hover:underline">Upload report</button>}>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {labs.map((l) => (
                <li key={l.name + l.date} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/40 transition">
                  <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {l.name}
                      {l.flagged && <span className="text-[10px] uppercase tracking-wider font-semibold text-warning bg-warning/15 px-1.5 py-0.5 rounded">flagged</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{l.date} · {l.status} · {l.size}</div>
                  </div>
                  <button className="size-8 rounded-md hover:bg-secondary inline-flex items-center justify-center" aria-label="View">
                    <Eye className="size-4 text-muted-foreground" />
                  </button>
                  <button className="size-8 rounded-md hover:bg-secondary inline-flex items-center justify-center" aria-label="Download">
                    <Download className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Scans & docs */}
          <SectionCard id="scans" icon={ImageIcon} title="Scans & documents">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scans.map((s) => (
                <div key={s.name} className="rounded-lg border border-border overflow-hidden card-hover bg-card">
                  <div className="aspect-[4/3] bg-secondary/60 relative flex items-center justify-center"
                       style={{ backgroundImage: "var(--grid-bg)", backgroundSize: "16px 16px" }}>
                    <ImageIcon className="size-8 text-muted-foreground/50" />
                    <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider font-semibold text-primary bg-card/90 px-1.5 py-0.5 rounded border border-border">{s.modality}</span>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.date} · {s.size}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* SOAP notes */}
          <SectionCard id="soap" icon={ClipboardList} title="SOAP notes">
            <div className="space-y-4">
              {soapNotes.map((n) => (
                <article key={n.date} className="rounded-lg border border-border p-5">
                  <header className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">{n.author}</div>
                      <div className="text-xs text-muted-foreground">{n.date}</div>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground">Signed</span>
                  </header>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <SoapRow label="S — Subjective" text={n.s} />
                    <SoapRow label="O — Objective" text={n.o} />
                    <SoapRow label="A — Assessment" text={n.a} />
                    <SoapRow label="P — Plan" text={n.p} />
                  </dl>
                </article>
              ))}
            </div>
          </SectionCard>

          {/* Prescriptions */}
          <SectionCard id="rx" icon={FileSignature} title="Prescription history">
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">RX #</th>
                    <th className="text-left font-semibold px-4 py-3">Medication</th>
                    <th className="text-left font-semibold px-4 py-3">Date</th>
                    <th className="text-left font-semibold px-4 py-3">Prescriber</th>
                    <th className="text-left font-semibold px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prescriptions.map((p) => (
                    <tr key={p.rx} className="hover:bg-secondary/40 transition">
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.rx}</td>
                      <td className="px-4 py-3 font-medium">{p.drug}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.prescriber}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[11px] px-2 py-1 rounded-md", p.status === "Active" ? "bg-success/10 text-success" : "bg-secondary text-secondary-foreground")}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Appointments */}
          <SectionCard id="appointments" icon={Calendar} title="Appointment history">
            <ul className="divide-y divide-border rounded-lg border border-border">
              {appointments.map((a, i) => (
                <li key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/40 transition">
                  <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Calendar className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{a.type}</div>
                    <div className="text-xs text-muted-foreground">{a.date} · with {a.with}</div>
                  </div>
                  <span className={cn("text-[11px] px-2 py-1 rounded-md",
                    a.status === "Upcoming" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground")}>
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Audit */}
          <SectionCard id="audit" icon={ShieldCheck} title="Audit access history" description="Every chart access is recorded.">
            <ul className="divide-y divide-border rounded-lg border border-border">
              {auditTrail.map((a, i) => (
                <li key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="size-9 rounded-full bg-secondary text-foreground/70 flex items-center justify-center text-xs font-semibold">
                    {a.who.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{a.who} <span className="text-muted-foreground font-normal">· {a.role}</span></div>
                    <div className="text-xs text-muted-foreground">{a.action}</div>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">{a.when}</div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Lock className="size-3" /> Audit log immutable. Exportable for compliance review.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon, label, title, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; title: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/70 px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="text-sm font-medium text-foreground mt-1">{title}</div>
      <div className="text-xs text-muted-foreground truncate">{sub}</div>
    </div>
  );
}

function RiskTile({ label, value, level, detail }: { label: string; value: string; level: "low" | "moderate" | "high" | "good"; detail: string }) {
  const map: Record<string, string> = {
    low: "bg-success/10 text-success",
    moderate: "bg-warning/15 text-warning",
    high: "bg-destructive/10 text-destructive",
    good: "bg-primary/10 text-primary",
  };
  return (
    <div className="rounded-lg border border-border p-4 bg-card card-hover">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md", map[level])}>{value}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{detail}</div>
    </div>
  );
}

function SuggestionPill({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" /> {title}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{detail}</div>
    </div>
  );
}

function SoapRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider font-semibold text-primary">{label}</dt>
      <dd className="text-sm text-foreground/85 mt-1 leading-relaxed">{text}</dd>
    </div>
  );
}