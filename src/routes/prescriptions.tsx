import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Download, Plus, Pill, FileText } from "lucide-react";

export const Route = createFileRoute("/prescriptions")({ component: PrescriptionsPage });

const rxList = [
  { id: "RX-2041", patient: "Maya Chen",     drug: "Lisinopril 10 mg",        sig: "1 tab PO daily",          qty: "#30", refills: 3, status: "Sent",    pharmacy: "CVS · Mission St" },
  { id: "RX-2040", patient: "Daniel Ortiz",  drug: "Metformin 500 mg",        sig: "1 tab PO BID with meals", qty: "#60", refills: 5, status: "Sent",    pharmacy: "Walgreens · 4th Ave" },
  { id: "RX-2039", patient: "Priya Anand",   drug: "Ferrous sulfate 325 mg",  sig: "1 tab PO daily",          qty: "#90", refills: 2, status: "Draft",   pharmacy: "—" },
  { id: "RX-2038", patient: "Sam Whitaker",  drug: "Sumatriptan 50 mg",       sig: "1 tab PO PRN migraine",   qty: "#9",  refills: 0, status: "Sent",    pharmacy: "Express Scripts mail" },
];

const pillTone: Record<string, string> = {
  Sent: "pill pill--success",
  Draft: "pill pill--warning",
};

function PrescriptionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="e-Rx"
        title="Prescriptions"
        description="Compose, e-sign, and dispatch prescriptions via Surescripts."
        actions={
          <>
            <button className="btn btn-secondary">Templates</button>
            <button className="btn btn-primary"><Plus className="size-4" /> New prescription</button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 surface">
          <div className="section-head">
            <div>
              <div className="section-head__title">Recent prescriptions</div>
              <div className="section-head__sub">Past 7 days · Surescripts queue clear</div>
            </div>
            <button className="btn btn-ghost btn-sm">View all</button>
          </div>
          <ul className="divide-y divide-border">
            {rxList.map((r, i) => (
              <li
                key={r.id}
                className="px-5 py-4 flex items-center gap-4 hover:bg-primary/[0.04] transition-colors animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden>
                  <Pill className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.drug}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.patient} · {r.sig} · {r.qty} · Refills {r.refills}
                  </div>
                </div>
                <div className="hidden md:block text-xs text-muted-foreground truncate max-w-[10rem]">{r.pharmacy}</div>
                <span className={pillTone[r.status]}>{r.status}</span>
                <button className="btn btn-ghost btn-sm" aria-label={`Download PDF for ${r.id}`}>
                  <Download className="size-3.5" /> PDF
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Mock Rx preview */}
        <div className="surface p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="section-head__title">Preview</div>
            <span className="pill pill--neutral">PDF</span>
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
              <div className="text-xs text-muted-foreground">Sig: Take 1 tablet by mouth once daily.</div>
              <div className="text-xs text-muted-foreground">Disp: #30 · Refills: 3 · DAW: No</div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <FileText className="size-3" aria-hidden /> e-Signed · Dr. M. Reyes, MD · May 27, 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}