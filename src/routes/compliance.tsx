import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ShieldCheck, Lock, FileLock2, Eye, KeyRound, ServerCog } from "lucide-react";
import { useAuditLogs } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/compliance")({ component: CompliancePage });

const controls = [
  { icon: Lock, title: "End-to-end encryption", desc: "All PHI is encrypted in transit (TLS 1.3) and at rest (AES-256).", status: "Active" },
  { icon: KeyRound, title: "MFA enforced", desc: "TOTP & WebAuthn required for all staff. SSO via Okta supported.", status: "Active" },
  { icon: Eye, title: "Audit trail", desc: "Every chart view, edit, and export is logged with user, IP, and timestamp.", status: "Active" },
  { icon: FileLock2, title: "BAA on file", desc: "Business Associate Agreements signed with all subprocessors.", status: "Signed" },
  { icon: ServerCog, title: "Data residency", desc: "PHI stored in US-only HIPAA-eligible regions.", status: "US-East" },
  { icon: ShieldCheck, title: "Annual risk review", desc: "SOC 2 Type II · HITRUST CSF certified. Next review: Q3 2026.", status: "Current" },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function prettyAction(a: string) {
  return a.replace(/[._]/g, " ");
}

function CompliancePage() {
  const { data: logs, isLoading } = useAuditLogs(30);

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
            <div key={c.title} className="surface p-5 lift-on-hover animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
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
            <div className="section-head__sub">Immutable log · {logs?.length ?? 0} entries · streamed to SIEM</div>
          </div>
          <button className="btn btn-ghost btn-sm">Export CSV</button>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !logs || logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No audit events recorded yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((l, i) => (
              <li key={l.id} className="px-5 py-3.5 flex items-center gap-4 text-sm hover:bg-primary/[0.04] transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 25}ms` }}>
                <div className="size-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[11px] font-medium">
                  {(l.user_id ?? "??").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate capitalize">{prettyAction(l.action)}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l.entity}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">{timeAgo(l.created_at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
