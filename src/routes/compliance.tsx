import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ShieldCheck, Lock, FileLock2, Eye, KeyRound, ServerCog } from "lucide-react";

export const Route = createFileRoute("/compliance")({ component: CompliancePage });

const controls = [
  { icon: Lock, title: "End-to-end encryption", desc: "All PHI is encrypted in transit (TLS 1.3) and at rest (AES-256).", status: "Active" },
  { icon: KeyRound, title: "MFA enforced", desc: "TOTP & WebAuthn required for all staff. SSO via Okta supported.", status: "Active" },
  { icon: Eye, title: "Audit trail", desc: "Every chart view, edit, and export is logged with user, IP, and timestamp.", status: "Active" },
  { icon: FileLock2, title: "BAA on file", desc: "Business Associate Agreements signed with all subprocessors.", status: "Signed" },
  { icon: ServerCog, title: "Data residency", desc: "PHI stored in US-only HIPAA-eligible regions.", status: "US-East" },
  { icon: ShieldCheck, title: "Annual risk review", desc: "SOC 2 Type II · HITRUST CSF certified. Next review: Q3 2026.", status: "Current" },
];

const log = [
  { who: "Dr. Reyes", what: "Viewed chart · Maya Chen", when: "2 min ago" },
  { who: "Nurse Patel", what: "Updated vitals · Daniel Ortiz", when: "18 min ago" },
  { who: "Dr. Reyes", what: "Exported Rx PDF · RX-2041", when: "1 hr ago" },
  { who: "Billing", what: "Submitted claim · A-3209", when: "3 hr ago" },
];

function CompliancePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Trust & security"
        title="HIPAA compliance"
        description="Your practice's security posture, audit log, and ongoing controls."
        actions={
          <div className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-lg bg-success/10 text-success text-xs font-medium">
            <ShieldCheck className="size-4" /> All systems compliant
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {controls.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="size-5" />
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-success/15 text-success font-medium">{c.status}</span>
              </div>
              <div className="font-semibold tracking-tight">{c.title}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b border-border font-semibold tracking-tight">Recent audit events</div>
        <ul className="divide-y divide-border">
          {log.map((l, i) => (
            <li key={i} className="px-5 py-3.5 flex items-center gap-4 text-sm">
              <div className="size-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-medium">
                {l.who.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{l.who}</div>
                <div className="text-xs text-muted-foreground">{l.what}</div>
              </div>
              <div className="text-xs text-muted-foreground">{l.when}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}