import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProviders } from "@/hooks/queries";
import { useProviderSchedules, useUpsertSchedule, useDeleteSchedule } from "@/hooks/portal-queries";
import { usePermissions } from "@/lib/rbac";
import { Calendar, Trash2, Plus, Shield } from "lucide-react";
import { QueryErrorState } from "@/components/QueryErrorState";

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export const Route = createFileRoute("/admin/schedules")({ component: AdminSchedules });

function AdminSchedules() {
  const perms = usePermissions();
  const { data: providers } = useProviders();
  const [providerId, setProviderId] = useState<string>("");
  const { data: schedules, isLoading: schedulesLoading, isError: schedulesError, refetch: refetchSchedules } = useProviderSchedules(providerId || undefined);
  const upsert = useUpsertSchedule();
  const del = useDeleteSchedule();

  const [kind, setKind] = useState<"available"|"out_of_office">("available");
  const [weekday, setWeekday] = useState<number>(1);
  const [startMin, setStartMin] = useState<number>(9 * 60);
  const [endMin, setEndMin] = useState<number>(17 * 60);
  const [oooStart, setOooStart] = useState("");
  const [oooEnd, setOooEnd] = useState("");
  const [note, setNote] = useState("");

  if (!perms.has("admin.schedules")) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Shield className="size-8 mx-auto text-warning mb-3" />
        <h2 className="font-semibold">Restricted</h2>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Calendar className="size-5 text-primary" /> Provider schedules</h1>
          <p className="text-sm text-muted-foreground">Weekly availability windows and out-of-office blocks.</p>
        </div>
        <select value={providerId} onChange={(e) => setProviderId(e.target.value)}
          className="h-10 px-3 rounded-lg bg-secondary text-sm">
          <option value="">All providers</option>
          {(providers ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </header>

      {schedulesError && (
        <QueryErrorState compact title="Couldn't load schedules" onRetry={() => refetchSchedules()} />
      )}
      {schedulesLoading && providerId && (
        <div className="text-sm text-muted-foreground">Loading schedules…</div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!providerId) return;
          await upsert.mutateAsync({
            provider_id: providerId, kind,
            weekday: kind === "available" ? weekday : null,
            start_minute: kind === "available" ? startMin : null,
            end_minute: kind === "available" ? endMin : null,
            starts_at: kind === "out_of_office" ? new Date(oooStart).toISOString() : null,
            ends_at: kind === "out_of_office" ? new Date(oooEnd).toISOString() : null,
            note: note || null,
          });
          setNote("");
        }}
        className="rounded-xl border border-border bg-card p-4 grid md:grid-cols-2 gap-3"
      >
        <div className="md:col-span-2 flex gap-2">
          {(["available","out_of_office"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={`px-3 py-1.5 text-xs rounded-full ${kind === k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {k === "available" ? "Weekly availability" : "Out of office"}
            </button>
          ))}
        </div>

        {kind === "available" ? (
          <>
            <div>
              <label className="text-xs text-muted-foreground">Weekday</label>
              <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="w-full h-10 px-3 rounded-lg bg-secondary text-sm">
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TimeInput label="Start" minutes={startMin} onChange={setStartMin} />
              <TimeInput label="End" minutes={endMin} onChange={setEndMin} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-muted-foreground">Starts</label>
              <input type="datetime-local" value={oooStart} onChange={(e) => setOooStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-secondary text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ends</label>
              <input type="datetime-local" value={oooEnd} onChange={(e) => setOooEnd(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-secondary text-sm" />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground">Note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional"
            className="w-full h-10 px-3 rounded-lg bg-secondary text-sm" />
        </div>

        <div className="md:col-span-2">
          <button type="submit" disabled={!providerId || upsert.isPending}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1 disabled:opacity-50">
            <Plus className="size-4" /> Add schedule
          </button>
        </div>
      </form>

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="px-4 py-3 border-b border-border text-sm font-semibold">Schedules</header>
        {(schedules ?? []).length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No schedules configured.</div>
        ) : (
          <ul className="divide-y divide-border">
            {(schedules ?? []).map((s) => (
              <li key={s.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {(s as { provider?: { name?: string } | null }).provider?.name ?? "—"} ·{" "}
                    {s.kind === "available"
                      ? `${WEEKDAYS[s.weekday ?? 0]} ${fmtMin(s.start_minute)}–${fmtMin(s.end_minute)}`
                      : `OOO ${s.starts_at ? new Date(s.starts_at).toLocaleString() : ""} → ${s.ends_at ? new Date(s.ends_at).toLocaleString() : ""}`}
                  </div>
                  {s.note && <div className="text-xs text-muted-foreground truncate">{s.note}</div>}
                </div>
                <button onClick={() => del.mutate(s.id)} className="text-destructive hover:text-destructive/80" aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TimeInput({ label, minutes, onChange }: { label: string; minutes: number; onChange: (v: number) => void }) {
  const hh = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mm = (minutes % 60).toString().padStart(2, "0");
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type="time" value={`${hh}:${mm}`} onChange={(e) => {
        const [h, m] = e.target.value.split(":").map(Number);
        onChange(h * 60 + m);
      }} className="w-full h-10 px-3 rounded-lg bg-secondary text-sm" />
    </div>
  );
}

function fmtMin(m: number | null | undefined) {
  if (m == null) return "—";
  const h = Math.floor(m / 60); const mm = m % 60;
  return `${h.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}