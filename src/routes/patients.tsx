import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Filter, FileText, Lock, ShieldCheck } from "lucide-react";
import { UrgencyBadge, type Urgency } from "@/components/UrgencyBadge";

export const Route = createFileRoute("/patients")({ component: PatientsPage });

const patients = [
  { name: "Maya Chen", id: "P-10234", age: 42, sex: "F", lastVisit: "May 18, 2026", conditions: ["Hypertension", "Asthma"], urgency: "routine" as Urgency },
  { name: "Daniel Ortiz", id: "P-10182", age: 56, sex: "M", lastVisit: "Apr 30, 2026", conditions: ["Type 2 Diabetes"], urgency: "routine" as Urgency },
  { name: "Priya Anand", id: "P-10301", age: 31, sex: "F", lastVisit: "May 22, 2026", conditions: ["Anemia"], urgency: "urgent" as Urgency },
  { name: "Sam Whitaker", id: "P-10112", age: 38, sex: "M", lastVisit: "May 9, 2026", conditions: ["Migraine"], urgency: "routine" as Urgency },
  { name: "Rosa Lin", id: "P-10078", age: 64, sex: "F", lastVisit: "May 11, 2026", conditions: ["Post-op recovery"], urgency: "routine" as Urgency },
  { name: "Jonas Becker", id: "P-10350", age: 27, sex: "M", lastVisit: "May 21, 2026", conditions: ["Healthy"], urgency: "stable" as Urgency },
];

function PatientsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Patients"
        description="Search, manage records, and review longitudinal medical history."
        actions={
          <>
            <button className="btn btn-secondary"><Filter className="size-4" /> Filter</button>
            <button className="btn btn-primary"><Plus className="size-4" /> New patient</button>
          </>
        }
      />

      <div className="surface">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-secondary/70 backdrop-blur text-muted-foreground text-[11px] uppercase tracking-wider">
            <tr>
              <th className="text-left font-semibold px-5 py-3">Patient</th>
              <th className="text-left font-semibold px-5 py-3">MRN</th>
              <th className="text-left font-semibold px-5 py-3">Age / Sex</th>
              <th className="text-left font-semibold px-5 py-3">Conditions</th>
              <th className="text-left font-semibold px-5 py-3">Last visit</th>
              <th className="text-left font-semibold px-5 py-3">Triage</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((p, i) => (
              <tr
                key={p.id}
                className="table-row-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-semibold">
                      {p.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{p.name}</span>
                      <Lock className="size-3 text-muted-foreground/60" aria-label="PHI protected" />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{p.id}</td>
                <td className="px-5 py-3.5 tabular-nums">{p.age} · {p.sex}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {p.conditions.map((c) => (
                      <span key={c} className="pill pill--neutral">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{p.lastVisit}</td>
                <td className="px-5 py-3.5"><UrgencyBadge level={p.urgency} /></td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <a href="#" className="text-xs text-muted-foreground hover:text-primary" title="Audit trail">
                      <ShieldCheck className="size-3.5" aria-label="View audit trail" />
                    </a>
                    <Link
                      to="/patients/$patientId"
                      params={{ patientId: p.id }}
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                    >
                      <FileText className="size-3.5" aria-hidden /> Chart
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
        <Lock className="size-3" aria-hidden /> All PHI encrypted at rest · AES-256 · last sync 2 min ago
      </p>
    </div>
  );
}