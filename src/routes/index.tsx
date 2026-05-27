import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  Users,
  CalendarDays,
  Activity,
  ArrowUpRight,
  Clock,
  Video,
  FileText,
  Sparkles,
  Lock,
} from "lucide-react";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { AIInsightCard } from "@/components/copilot/AIInsightCard";

export const Route = createFileRoute("/")({
  component: Index,
});

const stats = [
  { label: "Patients seen today", value: "28", delta: "+12%", icon: Users },
  { label: "Upcoming appointments", value: "14", delta: "next at 2:30 PM", icon: CalendarDays },
  { label: "Revenue this month", value: "$148,920", delta: "+8.4%", icon: Activity },
  { label: "Open claims", value: "37", delta: "5 require attention", icon: FileText },
];

const schedule = [
  { time: "9:00 AM", name: "Maya Chen", reason: "Follow-up — hypertension", status: "Checked in", urgency: "routine" as const },
  { time: "9:30 AM", name: "Daniel Ortiz", reason: "Annual physical", status: "In room 3", urgency: "stable" as const },
  { time: "10:15 AM", name: "Priya Anand", reason: "Lab review — abnormal CBC", status: "Confirmed", urgency: "urgent" as const },
  { time: "11:00 AM", name: "Sam Whitaker", reason: "Telehealth · Migraine", status: "Telehealth", tele: true, urgency: "routine" as const },
  { time: "1:30 PM", name: "Rosa Lin", reason: "Post-op check", status: "Confirmed", urgency: "stable" as const },
];

const activity = [
  { icon: FileText, text: "Prescription for Maya Chen signed and sent to CVS Pharmacy." },
  { icon: Sparkles, text: "AI symptom check flagged possible iron deficiency for new intake." },
  { icon: Video, text: "Telehealth session with Sam W. ended — notes saved to chart." },
  { icon: Activity, text: "Insurance claim #A‑3209 approved by Blue Shield ($420)." },
];

function Index() {
  // Import locally to keep diff small
  return (
    <div>
      <PageHeader
        eyebrow="Wednesday · May 27, 2026"
        title="Good morning, Dr. Reyes"
        description="Here's what's happening across your practice today."
        actions={
          <>
            <button className="btn btn-secondary">Print huddle</button>
            <button className="btn btn-primary">New appointment <ArrowUpRight className="size-4" /></button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="surface p-5 lift-on-hover animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="label-eyebrow">{s.label}</div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center" aria-hidden>
                  <Icon className="size-4" aria-hidden />
                </div>
              </div>
              <div className="mt-3 text-[1.625rem] font-semibold tracking-tight tabular-nums">{s.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{s.delta}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's schedule */}
        <div className="lg:col-span-2 surface">
          <div className="section-head">
            <div>
              <div className="section-head__title">Today's schedule</div>
              <div className="section-head__sub">5 appointments · 1 telehealth · 2 open slots</div>
            </div>
            <button className="btn btn-ghost btn-sm">View calendar</button>
          </div>
          <ul className="divide-y divide-border">
            {schedule.map((a, i) => (
              <li
                key={a.time}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-primary/[0.04] transition-colors animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-20 shrink-0 text-sm font-medium tabular-nums">{a.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground truncate" title={a.reason}>{a.reason}</div>
                </div>
                <UrgencyBadge level={a.urgency} />
                <span className={a.tele ? "pill pill--info" : "pill pill--neutral"}>
                  {a.status}
                </span>
                <Lock className="size-3 text-muted-foreground/60" aria-label="PHI encrypted" />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <AIInsightCard
            title="3 charts ready for a copilot review"
            summary="Priya Anand has an abnormal CBC trend; Maya Chen's BP is creeping above goal; Rosa Lin is due for a post-op review."
            suggestions={[
              { label: "Summarize Priya's chart", prompt: "Summarize Priya Anand's recent labs and prior visits, highlighting the abnormal CBC trend and proposed next steps." },
              { label: "Draft BP plan for Maya", prompt: "Draft a hypertension management update for Maya Chen, including lifestyle and medication titration options. Use SOAP." },
              { label: "Triage today's inbox", prompt: "Help me triage today's appointment requests by urgency and recommend in-person vs telemedicine." },
            ]}
          />

        {/* Activity */}
        <div className="surface">
          <div className="section-head">
            <div>
              <div className="section-head__title">Recent activity</div>
              <div className="section-head__sub">Last 24 hours</div>
            </div>
          </div>
          <ul className="p-3 space-y-1">
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-primary/[0.04] transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden>
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="text-sm text-foreground/85 leading-snug">{a.text}</div>
                </li>
              );
            })}
          </ul>
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><Clock className="size-3.5" aria-hidden /> Synced just now</span>
            <a href="#" className="text-primary font-medium hover:underline">Audit trail →</a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
