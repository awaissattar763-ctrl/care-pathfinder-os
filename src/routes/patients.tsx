import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Filter, FileText } from "lucide-react";

export const Route = createFileRoute("/patients")({ component: PatientsPage });

const patients = [
  { name: "Maya Chen", id: "P-10234", age: 42, sex: "F", lastVisit: "May 18, 2026", conditions: ["Hypertension", "Asthma"], status: "Active" },
  { name: "Daniel Ortiz", id: "P-10182", age: 56, sex: "M", lastVisit: "Apr 30, 2026", conditions: ["Type 2 Diabetes"], status: "Active" },
  { name: "Priya Anand", id: "P-10301", age: 31, sex: "F", lastVisit: "May 22, 2026", conditions: ["Anemia"], status: "Lab pending" },
  { name: "Sam Whitaker", id: "P-10112", age: 38, sex: "M", lastVisit: "May 9, 2026", conditions: ["Migraine"], status: "Telehealth" },
  { name: "Rosa Lin", id: "P-10078", age: 64, sex: "F", lastVisit: "May 11, 2026", conditions: ["Post-op recovery"], status: "Recovering" },
  { name: "Jonas Becker", id: "P-10350", age: 27, sex: "M", lastVisit: "May 21, 2026", conditions: ["Healthy"], status: "Active" },
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
            <button className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary">
              <Filter className="size-4" /> Filter
            </button>
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Plus className="size-4" /> New patient
            </button>
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left font-medium px-5 py-3">Patient</th>
              <th className="text-left font-medium px-5 py-3">ID</th>
              <th className="text-left font-medium px-5 py-3">Age / Sex</th>
              <th className="text-left font-medium px-5 py-3">Conditions</th>
              <th className="text-left font-medium px-5 py-3">Last visit</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-secondary/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
                      {p.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="font-medium">{p.name}</div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{p.id}</td>
                <td className="px-5 py-3.5 tabular-nums">{p.age} · {p.sex}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {p.conditions.map((c) => (
                      <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{p.lastVisit}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] px-2 py-1 rounded-full bg-accent text-accent-foreground font-medium">{p.status}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                    <FileText className="size-3.5" /> Chart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}