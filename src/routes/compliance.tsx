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
          <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg bg-success/10 text-success text-xs font-medium">
            <span className="status-dot status-dot--live" aria-hidden /> All systems compliant
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {controls.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="surface p-5 lift-on-hover animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center" aria-hidden>
                  <Icon className="size-4" />
                </div>
                <span className="pill pill--success">{c.status}</span>
              </div>
              <div className="text-sm font-semibold tracking-tight">{c.title}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="surface">
        <div className="section-head">
          <div>
            <div className="section-head__title">Recent audit events</div>
            <div className="section-head__sub">Immutable log · streamed to SIEM</div>
          </div>
          <button className="btn btn-ghost btn-sm">Export CSV</button>
        </div>
        <ul className="divide-y divide-border">
          {log.map((l, i) => (
            <li
              key={i}
              className="px-5 py-3.5 flex items-center gap-4 text-sm hover:bg-primary/[0.04] transition-colors animate-fade-in-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="size-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[11px] font-medium">
                {l.who.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{l.who}</div>
                <div className="text-xs text-muted-foreground truncate">{l.what}</div>
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">{l.when}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}