import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Download, Plus, Pill, FileText } from "lucide-react";

export const Route = createFileRoute("/prescriptions")({ component: PrescriptionsPage });

const rxList = [
  { id: "RX-2041", patient: "Maya Chen", drug: "Lisinopril 10mg", qty: "30 tabs · 1 daily", status: "Sent", pharmacy: "CVS · Mission St" },
  { id: "RX-2040", patient: "Daniel Ortiz", drug: "Metformin 500mg", qty: "60 tabs · 2 daily", status: "Sent", pharmacy: "Walgreens · 4th Ave" },
  { id: "RX-2039", patient: "Priya Anand", drug: "Ferrous sulfate 325mg", qty: "90 tabs · 1 daily", status: "Draft", pharmacy: "—" },
  { id: "RX-2038", patient: "Sam Whitaker", drug: "Sumatriptan 50mg", qty: "9 tabs · as needed", status: "Sent", pharmacy: "Mail order" },
];

function PrescriptionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="e-Rx"
        title="Prescriptions"
        description="Compose, sign, and dispatch prescriptions. Export PDF for patient records."
        actions={
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Plus className="size-4" /> New prescription
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b border-border font-semibold tracking-tight">Recent prescriptions</div>
          <ul className="divide-y divide-border">
            {rxList.map((r) => (
              <li key={r.id} className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/40">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pill className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{r.drug}</div>
                  <div className="text-xs text-muted-foreground">{r.patient} · {r.qty}</div>
                </div>
                <div className="hidden sm:block text-xs text-muted-foreground">{r.pharmacy}</div>
                <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${r.status === "Sent" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {r.status}
                </span>
                <button className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                  <Download className="size-3.5" /> PDF
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Mock Rx preview */}
        <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold tracking-tight">Preview</div>
            <span className="text-[11px] px-2 py-1 rounded-full bg-secondary">PDF</span>
          </div>
          <div className="rounded-lg border border-dashed border-border p-5 bg-secondary/30">
            <div className="text-[11px] text-muted-foreground tracking-widest uppercase">HealthOS Rx · RX-2041</div>
            <div className="mt-3 font-serif text-xl text-primary italic">℞</div>
            <div className="mt-2 text-sm">
              <div className="font-semibold">Maya Chen</div>
              <div className="text-xs text-muted-foreground">DOB · 1983-04-12 · P-10234</div>
            </div>
            <div className="mt-4 text-sm border-t border-border pt-3">
              <div className="font-medium">Lisinopril 10 mg tablet</div>
              <div className="text-xs text-muted-foreground">Sig: Take 1 tablet by mouth daily.</div>
              <div className="text-xs text-muted-foreground">Qty: 30 · Refills: 3</div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <FileText className="size-3" /> Signed · Dr. Reyes · May 23, 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}