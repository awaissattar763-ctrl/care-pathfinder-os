import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, MessageSquare,
  ShieldCheck, Lock, Signal, Sparkles, Paperclip, Send, Pill, CalendarPlus, FileText,
  ClipboardList, Stethoscope, Activity, Maximize2, Users, ChevronLeft, Settings,
  Clock, Captions, Save, Download, AlertTriangle, Droplet, ChevronRight, CircleDot,
  Loader2, X, FileSignature,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { NewPrescriptionDialog } from "@/components/dialogs/NewPrescriptionDialog";
import { NewAppointmentDialog } from "@/components/dialogs/NewAppointmentDialog";
import {
  useAppointmentDetail, usePatientDetails, useCreateSoapNote,
  useUpdateAppointmentStatus, type AppointmentWithRefs,
} from "@/hooks/queries";
import { downloadICS } from "@/lib/ics";

export const Route = createFileRoute("/telemedicine/$appointmentId")({
  component: TelemedicineRoom,
});

function TelemedicineRoom() {
  const { appointmentId } = Route.useParams();
  const navigate = useNavigate();
  const { data: appt, isLoading: apptLoading, error: apptError } = useAppointmentDetail(appointmentId);
  const patientId = appt?.patient?.id;
  const { data: details, isLoading: detailsLoading } = usePatientDetails(patientId);
  const updateStatus = useUpdateAppointmentStatus();

  // Local media (real WebRTC getUserMedia for the provider preview)
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [joined, setJoined] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [tab, setTab] = useState<"notes" | "chat" | "summary">("notes");
  const [drawer, setDrawer] = useState<null | "summary">(null);
  const seconds = useTimer(joined);

  useEffect(() => {
    if (!joined) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) {
        setMediaError(e instanceof Error ? e.message : "Camera unavailable");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [joined]);

  useEffect(() => {
    const s = streamRef.current; if (!s) return;
    s.getAudioTracks().forEach((t) => (t.enabled = !muted));
    s.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [muted, camOn]);

  async function endCall() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (appt && appt.status !== "completed")
      await updateStatus.mutateAsync({ id: appt.id, status: "completed" });
    toast.success("Session ended and chart updated");
    navigate({ to: "/telemedicine" });
  }

  if (apptLoading) return <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-[420px] w-full" /></div>;
  if (apptError || !appt) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Session not found"
        description="This telemedicine session does not exist or has been removed."
        action={<Link to="/telemedicine" className="btn btn-primary">Back to telemedicine</Link>}
      />
    );
  }
  if (!appt.patient) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No patient on this appointment"
        description="Assign a patient before starting the visit."
        action={<Link to="/telemedicine" className="btn btn-primary">Back to telemedicine</Link>}
      />
    );
  }

  const patient = appt.patient;
  const initials = patient.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in-up">
      {/* Top status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/telemedicine" className="btn btn-ghost btn-sm" aria-label="Back to telemedicine">
            <ChevronLeft className="size-4" /> Lobby
          </Link>
          <div className="h-4 w-px bg-border" />
          {joined && (
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-destructive">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60 animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-destructive" />
              </span>
              Live
            </span>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight truncate">
              {patient.name} · {patient.sex ?? "—"}{patient.dob ? ` · ${ageFromDob(patient.dob)}y` : ""} · {appt.reason ?? "Virtual visit"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1"><Lock className="size-3" /> E2EE</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3 text-success" /> HIPAA secure</span>
              <span>·</span>
              <span className="tabular-nums">Session {appt.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {joined && <ConnectionPill />}
          <div className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm tabular-nums">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="font-medium">{formatTime(seconds)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        {/* Stage + controls + workspace */}
        <div className="space-y-5 min-w-0">
          <Stage
            joined={joined}
            onJoin={() => setJoined(true)}
            patientName={patient.name}
            initials={initials}
            camOn={camOn}
            muted={muted}
            sharing={sharing}
            captions={captions}
            videoRef={videoRef}
            mediaError={mediaError}
          />

          {joined && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2">
                <CtrlBtn label={muted ? "Unmute" : "Mute"} active={!muted} onClick={() => setMuted((v) => !v)} icon={muted ? MicOff : Mic} danger={muted} />
                <CtrlBtn label={camOn ? "Stop video" : "Start video"} active={camOn} onClick={() => setCamOn((v) => !v)} icon={camOn ? VideoIcon : VideoOff} danger={!camOn} />
                <CtrlBtn label={sharing ? "Stop sharing" : "Share screen"} active={sharing} onClick={() => setSharing((v) => !v)} icon={MonitorUp} />
                <CtrlBtn label={captions ? "Hide captions" : "Show captions"} active={captions} onClick={() => setCaptions((v) => !v)} icon={Captions} />
                <div className="hidden md:block h-6 w-px bg-border mx-1" />
                <button className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm border border-border bg-card hover:bg-secondary">
                  <Users className="size-4" /> Invite
                </button>
                <button className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm border border-border bg-card hover:bg-secondary">
                  <Settings className="size-4" /> Devices
                </button>
              </div>

              <div className="flex items-center gap-2">
                <NewPrescriptionDialog
                  defaultPatientId={patient.id}
                  trigger={
                    <button className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary">
                      <Pill className="size-4 text-primary" /> Prescribe
                    </button>
                  }
                />
                <NewAppointmentDialog
                  trigger={
                    <button className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary">
                      <CalendarPlus className="size-4 text-primary" /> Follow-up
                    </button>
                  }
                />
                <button onClick={() => setDrawer("summary")} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles className="size-4" /> Visit summary
                </button>
                <button onClick={() => downloadICS(appt as unknown as AppointmentWithRefs)} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm border border-border bg-card hover:bg-secondary" title="Export to calendar">
                  <Download className="size-4" />
                </button>
                <div className="h-6 w-px bg-border mx-1" />
                <button onClick={endCall} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-destructive-foreground bg-destructive hover:opacity-90">
                  <PhoneOff className="size-4" /> End
                </button>
              </div>
            </div>
          )}

          {/* Workspace tabs */}
          <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between border-b border-border px-2">
              <div className="flex">
                <TabBtn active={tab === "notes"} onClick={() => setTab("notes")} icon={ClipboardList} label="SOAP note" />
                <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquare} label="In-call chat" />
                <TabBtn active={tab === "summary"} onClick={() => setTab("summary")} icon={Sparkles} label="Visit summary" />
              </div>
              <div className="text-[11px] text-muted-foreground pr-3 hidden md:flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-warning" /> Assistant only — clinician review required
              </div>
            </div>
            <div className="p-5 min-h-[280px]">
              {tab === "notes" && <SoapPanel patientId={patient.id} patientName={patient.name} />}
              {tab === "chat" && <ChatPanel />}
              {tab === "summary" && <SummaryPanel patient={patient} appt={appt} />}
            </div>
          </div>
        </div>

        {/* Sidebar with real chart data */}
        <aside className="space-y-5">
          <PatientCard patient={patient} initials={initials} loading={detailsLoading} />
          <AllergiesMedsCard
            loading={detailsLoading}
            allergies={(details?.allergies ?? []).map((a) => ({ name: a.name, severity: a.severity }))}
            medications={(details?.prescriptions ?? []).filter((r) => r.status !== "Cancelled").slice(0, 6).map((r) => `${r.drug} · ${r.sig}`)}
            conditions={patient.conditions ?? []}
          />
          <RecentVisitsCard loading={detailsLoading} visits={(details?.appointments ?? []).slice(0, 4)} />
          <CopilotShortcut patientId={patient.id} />
        </aside>
      </div>

      {drawer === "summary" && (
        <SummaryDrawer patient={patient} appt={appt} onClose={() => setDrawer(null)} />
      )}
    </div>
  );
}

/* ---------------- Stage ---------------- */
function Stage({
  joined, onJoin, patientName, initials, camOn, muted, sharing, captions, videoRef, mediaError,
}: {
  joined: boolean; onJoin: () => void; patientName: string; initials: string;
  camOn: boolean; muted: boolean; sharing: boolean; captions: boolean;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  mediaError: string | null;
}) {
  return (
    <div className="relative rounded-xl border border-border overflow-hidden bg-[oklch(0.16_0.03_240)]" style={{ boxShadow: "var(--shadow-card)", aspectRatio: "16 / 9" }}>
      <div className="absolute inset-0">
        <FauxVideo name={patientName} initials={initials} hue={200} />
      </div>

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {joined && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/95 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
              <span className="size-1.5 rounded-full bg-destructive animate-pulse" /> REC
            </span>
          )}
          {sharing && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/95 bg-primary/80 px-2 py-1 rounded-md">
              <MonitorUp className="size-3" /> Sharing screen
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/95 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
            <Lock className="size-3" /> E2EE
          </span>
          <button className="size-8 rounded-md bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/55 inline-flex items-center justify-center" aria-label="Fullscreen">
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Waiting room overlay */}
      {!joined && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="text-center text-white max-w-sm px-6">
            <div className="size-16 rounded-2xl bg-white/10 ring-1 ring-white/20 mx-auto mb-4 flex items-center justify-center">
              <VideoIcon className="size-7" />
            </div>
            <div className="text-base font-semibold tracking-tight">Waiting room</div>
            <p className="text-sm text-white/70 mt-1.5">
              {patientName} will see you the moment you join. Camera and mic will start when you click join.
            </p>
            <button onClick={onJoin} className="mt-5 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <VideoIcon className="size-4" /> Join session
            </button>
            <div className="text-[11px] text-white/60 mt-3 inline-flex items-center gap-1.5 justify-center">
              <Lock className="size-3" /> Encrypted end-to-end
            </div>
          </div>
        </div>
      )}

      {/* Patient nameplate */}
      {joined && (
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 bg-black/45 backdrop-blur-md text-white/95 px-2.5 py-1.5 rounded-md text-xs">
          <span className="font-medium">{patientName}</span>
          <span className="opacity-70">· Patient</span>
        </div>
      )}

      {joined && captions && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[80%]">
          <div className="text-center text-sm text-white bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-md">
            <span className="opacity-70">Live captions enabled</span>
          </div>
        </div>
      )}

      {/* Doctor PiP */}
      {joined && (
        <div className="absolute bottom-4 right-4 w-44 sm:w-56 aspect-video rounded-lg overflow-hidden ring-2 ring-white/15 shadow-xl bg-[oklch(0.18_0.03_240)]">
          {camOn && !mediaError ? (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/80">
              <VideoOff className="size-6 mb-1" />
              <span className="text-[11px]">{mediaError ? "Camera blocked" : "Camera off"}</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 bg-black/55 px-1.5 py-0.5 rounded text-[10px] text-white">
            You {muted && <MicOff className="size-3 text-destructive ml-1" />}
          </div>
        </div>
      )}
    </div>
  );
}

function FauxVideo({ name, initials, hue }: { name: string; initials: string; hue: number }) {
  return (
    <div className="w-full h-full relative" style={{
      background: `radial-gradient(120% 80% at 50% 30%, oklch(0.45 0.08 ${hue}) 0%, oklch(0.22 0.05 ${hue}) 60%, oklch(0.14 0.03 ${hue}) 100%)`,
    }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-28 sm:size-36 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/15 flex items-center justify-center text-white text-3xl sm:text-4xl font-semibold tracking-tight">{initials}</div>
      </div>
      <span className="sr-only">{name} video feed</span>
    </div>
  );
}

/* ---------------- Controls ---------------- */
function CtrlBtn({
  icon: Icon, label, active, danger, onClick,
}: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className={cn("size-10 rounded-lg inline-flex items-center justify-center border transition",
        danger ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15"
               : active ? "bg-secondary text-foreground border-border hover:bg-secondary/80"
                        : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary")}>
      <Icon className="size-4" />
    </button>
  );
}

function ConnectionPill() {
  return (
    <div className="h-9 px-3 rounded-lg border border-border bg-card inline-flex items-center gap-2 text-xs">
      <Signal className="size-3.5 text-success" />
      <span className="font-medium text-foreground">Excellent</span>
      <span className="text-muted-foreground tabular-nums hidden sm:inline">· 38 ms · 1080p</span>
    </div>
  );
}

function TabBtn({
  icon: Icon, label, active, onClick,
}: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("relative inline-flex items-center gap-2 px-4 py-3 text-sm transition",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
      <Icon className="size-4" />
      {label}
      {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-primary" />}
    </button>
  );
}

/* ---------------- SOAP Panel ---------------- */
function SoapPanel({ patientId, patientName }: { patientId: string; patientName: string }) {
  const [s, setS] = useState("");
  const [o, setO] = useState("");
  const [a, setA] = useState("");
  const [p, setP] = useState("");
  const save = useCreateSoapNote();

  async function onSave() {
    if (!s && !o && !a && !p) {
      toast.error("Add at least one section before saving.");
      return;
    }
    await save.mutateAsync({ patient_id: patientId, author: "Provider", s, o, a, p });
    setS(""); setO(""); setA(""); setP("");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SoapField label="S — Subjective" placeholder={`${patientName} reports…`} value={s} onChange={setS} />
        <SoapField label="O — Objective" placeholder="Vitals, exam findings…" value={o} onChange={setO} />
        <SoapField label="A — Assessment" placeholder="Working diagnosis & differential…" value={a} onChange={setA} />
        <SoapField label="P — Plan" placeholder="Treatment, follow-up, medications…" value={p} onChange={setP} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><CircleDot className="size-3 text-success" /> Draft only — not saved until you click Save</span>
        <button onClick={onSave} disabled={save.isPending}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50"
          style={{ background: "var(--gradient-primary)" }}>
          {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save to chart
        </button>
      </div>
    </div>
  );
}
function SoapField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="label-eyebrow mb-1.5">{label}</div>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full min-h-[110px] rounded-lg border border-border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
      />
    </div>
  );
}

/* ---------------- Chat ---------------- */
function ChatPanel() {
  const [messages, setMessages] = useState<{ from: "doctor" | "patient"; text: string; at: string }[]>([]);
  const [draft, setDraft] = useState("");
  function send() {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { from: "doctor", text: draft.trim(), at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setDraft("");
  }
  return (
    <div className="flex flex-col h-[300px]">
      <ul className="flex-1 overflow-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <li className="text-sm text-muted-foreground text-center py-12">No messages yet. Use chat to share secure links, lab values, or quick notes mid-visit.</li>
        )}
        {messages.map((m, i) => (
          <li key={i} className={cn("flex", m.from === "doctor" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              m.from === "doctor" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md")}>
              <div>{m.text}</div>
              <div className={cn("text-[10px] mt-1 tabular-nums",
                m.from === "doctor" ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.at}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
        <button className="size-8 rounded-md hover:bg-secondary inline-flex items-center justify-center" aria-label="Attach">
          <Paperclip className="size-4 text-muted-foreground" />
        </button>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Type a secure message…" className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground" />
        <button onClick={send} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <Send className="size-3.5" /> Send
        </button>
      </div>
      <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
        <Lock className="size-3" /> Messages are scoped to this encounter.
      </div>
    </div>
  );
}

/* ---------------- Summary Panel ---------------- */
function SummaryPanel({ patient, appt }: { patient: { name: string; id: string }; appt: { reason: string | null; scheduled_at: string } }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-foreground flex gap-2 items-start">
        <ShieldCheck className="size-3.5 mt-0.5 text-warning" /> Assistant Only — Requires Clinical Review.
      </div>
      <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Visit snapshot
        </div>
        <p className="text-sm text-foreground/85 mt-2 leading-relaxed">
          {patient.name} attended a virtual visit{appt.reason ? ` for ${appt.reason.toLowerCase()}` : ""} on{" "}
          {new Date(appt.scheduled_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.
          Use the SOAP note tab to compose the encounter and the Visit summary action to export a PDF after signing.
        </p>
      </div>
      <div className="text-[11px] italic text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck className="size-3" /> Not a substitute for clinical judgment.
      </div>
    </div>
  );
}

/* ---------------- Sidebar cards ---------------- */
function PatientCard({ patient, initials, loading }: { patient: { name: string; mrn: string; sex: string | null; dob: string | null; blood_group: string | null; id: string }; initials: string; loading: boolean }) {
  void loading;
  return (
    <div className="rounded-xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-semibold">{initials}</div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight truncate">{patient.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {patient.dob ? `${ageFromDob(patient.dob)}y · ` : ""}{patient.sex ?? "—"} · {patient.mrn}
          </div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          <Lock className="size-3" /> PHI
        </span>
      </div>
      <div className="p-5 space-y-3">
        <Row icon={Droplet} label="Blood group" value={patient.blood_group ?? "—"} accent="text-destructive" />
        <Link to="/patients/$patientId" params={{ patientId: patient.id }} className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          Open full chart <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn("size-3.5", accent ?? "text-muted-foreground")} /> {label}
      </div>
      <div className="text-sm font-medium text-foreground text-right truncate">{value}</div>
    </div>
  );
}

function AllergiesMedsCard({ loading, allergies, medications, conditions }: { loading: boolean; allergies: { name: string; severity: string | null }[]; medications: string[]; conditions: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Clinical summary</h3>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <div className="label-eyebrow mb-2 flex items-center gap-1.5"><AlertTriangle className="size-3 text-destructive" /> Allergies</div>
          {loading ? <Skeleton className="h-6 w-2/3" /> : allergies.length === 0 ? (
            <div className="text-xs text-muted-foreground">No known allergies.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a) => (
                <span key={a.name} className="text-[11px] px-2 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/15">
                  {a.name}{a.severity ? ` · ${a.severity}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="label-eyebrow mb-2 flex items-center gap-1.5"><Stethoscope className="size-3 text-primary" /> Active conditions</div>
          {conditions.length === 0 ? (
            <div className="text-xs text-muted-foreground">No conditions on file.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((c) => (
                <span key={c} className="text-[11px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{c}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="label-eyebrow mb-2 flex items-center gap-1.5"><Pill className="size-3 text-primary" /> Current medications</div>
          {loading ? <Skeleton className="h-12 w-full" /> : medications.length === 0 ? (
            <div className="text-xs text-muted-foreground">No active prescriptions.</div>
          ) : (
            <ul className="text-xs text-foreground/85 space-y-1">
              {medications.map((m) => (<li key={m} className="flex gap-2"><span className="text-muted-foreground">·</span>{m}</li>))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentVisitsCard({ loading, visits }: { loading: boolean; visits: { id: string; scheduled_at: string; reason: string | null; status: string; visit_type: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Recent visits</h3>
      </div>
      {loading ? (
        <div className="p-5 space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></div>
      ) : visits.length === 0 ? (
        <div className="px-5 py-6 text-xs text-muted-foreground text-center">No prior visits on file.</div>
      ) : (
        <ul className="divide-y divide-border">
          {visits.map((v) => (
            <li key={v.id} className="flex items-center gap-3 px-5 py-3">
              <div className="text-xs tabular-nums text-muted-foreground w-20">{new Date(v.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{v.reason ?? "Visit"}</div>
                <div className="text-[11px] text-muted-foreground capitalize">{v.visit_type} · {v.status}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CopilotShortcut({ patientId }: { patientId: string }) {
  return (
    <Link to="/patients/$patientId" params={{ patientId }} className="block rounded-xl border border-primary/15 bg-primary/[0.04] p-5 hover:bg-primary/[0.06] transition">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" /> AI Clinical Copilot
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
        Open the patient chart to generate a clinician-ready brief, flag medication safety issues, and review care gaps. Assistant-only — clinician review required.
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
        Open chart <ChevronRight className="size-3.5" />
      </span>
    </Link>
  );
}

/* ---------------- Visit summary drawer ---------------- */
function SummaryDrawer({
  patient, appt, onClose,
}: { patient: { name: string; id: string; mrn: string }; appt: { id: string; reason: string | null; scheduled_at: string }; onClose: () => void }) {
  const [body, setBody] = useState(
    `Visit summary — ${patient.name} (${patient.mrn})\nDate: ${new Date(appt.scheduled_at).toLocaleString()}\nReason: ${appt.reason ?? "Virtual visit"}\n\nAssessment:\n- \n\nPlan:\n- \n\nFollow-up:\n- \n\nAssistant Only — Requires Clinical Review.`
  );
  function exportPdf() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Visit summary — ${patient.name}</title>
      <style>body{font-family:ui-sans-serif,system-ui;max-width:720px;margin:40px auto;padding:0 24px;color:#111}pre{white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6}h1{font-size:18px;margin:0 0 4px}small{color:#666}</style></head>
      <body><h1>Visit Summary</h1><small>${patient.name} · ${patient.mrn} · ${new Date(appt.scheduled_at).toLocaleString()}</small><hr/><pre>${escapeHtml(body)}</pre>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="w-full max-w-[480px] bg-card border-l border-border h-full overflow-auto animate-fade-in-up" style={{ boxShadow: "var(--shadow-glow)" }}>
        <header className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <div className="label-eyebrow">Visit summary</div>
            <h2 className="text-base font-semibold tracking-tight mt-0.5">{patient.name}</h2>
          </div>
          <button onClick={onClose} className="size-8 rounded-md hover:bg-secondary inline-flex items-center justify-center" aria-label="Close"><X className="size-4" /></button>
        </header>
        <div className="p-5 space-y-4">
          <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-foreground flex gap-2 items-start">
            <ShieldCheck className="size-3.5 mt-0.5 text-warning" /> Assistant Only — Requires Clinical Review before sharing with the patient.
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full min-h-[340px] rounded-lg border border-border bg-background p-3 text-[13px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y" />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={exportPdf} className="inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm border border-border hover:bg-secondary"><Download className="size-4" /> Export PDF</button>
            <button onClick={() => { navigator.clipboard.writeText(body); toast.success("Copied summary"); }} className="inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm border border-border hover:bg-secondary"><FileSignature className="size-4" /> Copy</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- utils ---------------- */
function useTimer(active: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setS((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return s;
}
function formatTime(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
function ageFromDob(dob: string) {
  const d = new Date(dob); const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
}
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}