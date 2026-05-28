import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Filter, FileText, Lock, ShieldCheck, Search, Users } from "lucide-react";
import { UrgencyBadge, type Urgency } from "@/components/UrgencyBadge";
import { usePatients } from "@/hooks/queries";
import { NewPatientDialog } from "@/components/dialogs/NewPatientDialog";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/patients")({ component: PatientsPage });

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function calcAge(dob: string | null) {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / 3.15576e10);
}

function PatientsPage() {
  const [search, setSearch] = useState("");
  const [triage, setTriage] = useState<string>("all");
  const { data, isLoading } = usePatients(search);

  const filtered = (data ?? []).filter((p) => triage === "all" || p.urgency === triage);

  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Patients"
        description="Search, manage records, and review longitudinal medical history."
        actions={
          <>
            <select value={triage} onChange={(e) => setTriage(e.target.value)} className="btn btn-secondary">
              <option value="all">All triage</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
              <option value="stable">Stable</option>
            </select>
            <NewPatientDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> New patient</button>} />
          </>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, MRN, or email…"
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
        />
      </div>

      <div className="surface">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No matching patients" : "No patients yet"}
            description={search ? "Try a different name or MRN." : "Add your first patient to populate the registry."}
            action={!search && <NewPatientDialog trigger={<button className="btn btn-primary"><Plus className="size-4" /> Add patient</button>} />}
          />
        ) : (
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
              {filtered.map((p, i) => (
                <tr key={p.id} className="table-row-hover animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-semibold">
                        {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{p.name}</span>
                        <Lock className="size-3 text-muted-foreground/60" aria-label="PHI protected" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{p.mrn}</td>
                  <td className="px-5 py-3.5 tabular-nums">{calcAge(p.dob)} · {p.sex ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(p.conditions ?? []).slice(0, 3).map((c) => (
                        <span key={c} className="pill pill--neutral">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{formatDate(p.last_visit)}</td>
                  <td className="px-5 py-3.5"><UrgencyBadge level={(p.urgency as Urgency) ?? "routine"} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-xs text-muted-foreground" title="Audit trail">
                        <ShieldCheck className="size-3.5" aria-label="View audit trail" />
                      </span>
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
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
        <Lock className="size-3" aria-hidden /> All PHI encrypted at rest · AES-256 · {filtered.length} records
      </p>
    </div>
  );
}
