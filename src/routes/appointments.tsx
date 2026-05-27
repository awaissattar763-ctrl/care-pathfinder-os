import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/appointments")({ component: AppointmentsPage });

const hours = ["8:00", "9:00", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"];
const days = ["Mon 25", "Tue 26", "Wed 27", "Thu 28", "Fri 29"];

type Appt = { day: number; hour: number; len: number; name: string; type: string; tone: "primary" | "accent" | "success" };
const appts: Appt[] = [
  { day: 0, hour: 1, len: 1, name: "Maya Chen", type: "Follow-up", tone: "primary" },
  { day: 0, hour: 3, len: 2, name: "Block · Lab review", type: "Admin", tone: "accent" },
  { day: 1, hour: 0, len: 1, name: "Daniel Ortiz", type: "Physical", tone: "primary" },
  { day: 1, hour: 4, len: 1, name: "Sam Whitaker", type: "Telehealth", tone: "success" },
  { day: 2, hour: 2, len: 1, name: "Priya Anand", type: "Lab review", tone: "primary" },
  { day: 2, hour: 5, len: 1, name: "Rosa Lin", type: "Post-op", tone: "primary" },
  { day: 3, hour: 1, len: 2, name: "Group · Wellness", type: "Workshop", tone: "accent" },
  { day: 4, hour: 0, len: 1, name: "Jonas Becker", type: "New patient", tone: "primary" },
  { day: 4, hour: 3, len: 1, name: "Maya Chen", type: "Telehealth", tone: "success" },
];

const toneClass = {
  primary: "bg-primary/12 text-primary border-primary/25",
  accent: "bg-accent text-accent-foreground border-accent",
  success: "bg-success/15 text-success border-success/30",
};

function AppointmentsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="May 25 – May 29, 2026"
        title="Appointments"
        description="Book, reschedule, and run your weekly clinic."
        actions={
          <>
            <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
              <button className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary" aria-label="Previous week"><ChevronLeft className="size-4" /></button>
              <div className="px-3 text-xs font-medium border-x border-border h-9 flex items-center">This week</div>
              <button className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary" aria-label="Next week"><ChevronRight className="size-4" /></button>
            </div>
            <button className="btn btn-primary"><Plus className="size-4" /> Book</button>
          </>
        }
      />

      <div className="surface">
        <div className="grid" style={{ gridTemplateColumns: "70px repeat(5, minmax(0, 1fr))" }}>
          <div className="border-b border-r border-border bg-secondary/40" />
          {days.map((d) => (
            <div key={d} className="border-b border-border bg-secondary/40 px-3 py-2.5 text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}

          {hours.map((h, hi) => (
            <Fragment key={`row-${hi}`}>
              <div className="border-b border-r border-border px-2 py-3 text-[11px] text-muted-foreground tabular-nums text-right">
                {h}
              </div>
              {days.map((_, di) => {
                const cell = appts.find((a) => a.day === di && a.hour === hi);
                return (
                  <div key={`c-${hi}-${di}`} className="border-b border-border min-h-[56px] p-1 relative">
                    {cell && (
                      <div
                        className={`absolute inset-x-1 top-1 rounded-md border px-2 py-1.5 text-xs leading-tight ${toneClass[cell.tone]}`}
                        style={{ height: `calc(${cell.len * 56}px - 10px)` }}
                      >
                        <div className="font-medium truncate">{cell.name}</div>
                        <div className="opacity-80 truncate">{cell.type}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}