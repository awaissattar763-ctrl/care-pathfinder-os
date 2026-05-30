import fs from 'fs';

let code = fs.readFileSync('src/routes/patients.$patientId.tsx', 'utf8');

const startStr = `const p = data.patient;`;
const endStr = `const aiSummary = (p.ai_summary) || { overview: \`Patient \${p.name}.\`, recommendations: [] };`;

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr) + endStr.length;

const replacement = `  const p = data.patient;
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
    ...data.documents.map((d: any) => ({ date: d.uploaded_at, type: d.modality || "Document", title: d.name, by: "System", note: \`Size: \${d.size || "Unknown"}\` })),
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
  const aiSummary = (p.ai_summary as any) || { overview: \`Patient \${p.name}.\`, recommendations: [] };`;

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
} else {
  console.log("Could not find start or end bounds!");
}

// Fix mapping used in JSX:
// "Duplicate identifier User2"
code = code.replace(/import { User2 } from "lucide-react";\\n/, '');

fs.writeFileSync('src/routes/patients.$patientId.tsx', code);
console.log('Fixed types!');
