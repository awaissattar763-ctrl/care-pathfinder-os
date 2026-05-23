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
} from "lucide-react";

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
  { time: "9:00 AM", name: "Maya Chen", reason: "Follow-up — hypertension", status: "Checked in" },
  { time: "9:30 AM", name: "Daniel Ortiz", reason: "Annual physical", status: "In room 3" },
  { time: "10:15 AM", name: "Priya Anand", reason: "Lab review", status: "Confirmed" },
  { time: "11:00 AM", name: "Sam Whitaker", reason: "Telehealth · Migraine", status: "Telehealth", tele: true },
  { time: "1:30 PM", name: "Rosa Lin", reason: "Post-op check", status: "Confirmed" },
];

const activity = [
  { icon: FileText, text: "Prescription for Maya Chen signed and sent to CVS Pharmacy." },
  { icon: Sparkles, text: "AI symptom check flagged possible iron deficiency for new intake." },
  { icon: Video, text: "Telehealth session with Sam W. ended — notes saved to chart." },
  { icon: Activity, text: "Insurance claim #A‑3209 approved by Blue Shield ($420)." },
];

function Index() {
  return (
    <div>
      <PageHeader
        eyebrow="Wednesday, May 23"
        title="Good morning, Dr. Reyes"
        description="Here's what's happening across your practice today."
        actions={
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-primary-foreground transition" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            New appointment <ArrowUpRight className="size-4" />
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.delta}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's schedule */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-semibold tracking-tight">Today's schedule</div>
              <div className="text-xs text-muted-foreground">5 appointments · 1 telehealth</div>
            </div>
            <button className="text-xs text-primary font-medium hover:underline">View calendar</button>
          </div>
          <ul className="divide-y divide-border">
            {schedule.map((a) => (
              <li key={a.time} className="px-5 py-3.5 flex items-center gap-4 hover:bg-secondary/40 transition">
                <div className="w-20 shrink-0 text-sm font-medium tabular-nums">{a.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.reason}</div>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${a.tele ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Activity */}
        <div className="rounded-xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b border-border">
            <div className="font-semibold tracking-tight">Recent activity</div>
            <div className="text-xs text-muted-foreground">Last 24 hours</div>
          </div>
          <ul className="p-3 space-y-1">
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <li key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-sm text-foreground/85 leading-snug">{a.text}</div>
                </li>
              );
            })}
          </ul>
          <div className="px-5 py-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> Synced just now
          </div>
        </div>
      </div>
    </div>
  );
}
