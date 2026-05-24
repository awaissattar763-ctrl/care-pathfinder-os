import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, MessageSquare,
  ShieldCheck, Lock, Signal, Sparkles, FileSignature, Paperclip, Send, Pill,
  Plus, X, CalendarPlus, FileText, ClipboardList, Stethoscope, Activity,
  Maximize2, MoreHorizontal, Users, ChevronRight, Settings, CircleDot,
  Download, ImageIcon, Droplet, AlertTriangle, Clock, Captions,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/telemedicine")({ component: TelePage });

// ----------------------------- Demo data -----------------------------
const patient = {
  name: "Maya Chen",
  age: 42,
  sex: "F",
  mrn: "MRN-884127",
  bloodGroup: "A+",
  allergies: ["Penicillin (severe)", "Peanuts", "Latex"],
  conditions: ["Hypertension", "Mild persistent asthma"],
  medications: ["Lisinopril 10 mg qd", "Albuterol HFA PRN", "Vitamin D 2000 IU qd"],
  lastVisit: "May 18, 2026 — Dr. Okafor",
  reason: "Follow-up · headaches & BP review",
};

const files = [
  { name: "Lipid panel — Apr 2026.pdf", size: "92 KB", icon: FileText },
  { name: "Home BP log (2 wks).csv", size: "18 KB", icon: FileText },
  { name: "Headache diary photo.jpg", size: "1.4 MB", icon: ImageIcon },
];

const initialMessages = [
  { from: "patient", text: "Hi Dr. Okafor — I can hear you clearly.", at: "00:12" },
  { from: "doctor", text: "Great. I see your home BP log came through. Let's review.", at: "00:34" },
  { from: "patient", text: "Headaches mostly in the mornings, 2–3× per week.", at: "01:02" },
];

const transcript = [
  { spk: "Patient", text: "Most of the headaches happen first thing in the morning, kind of behind my eyes.", t: "00:48" },
  { spk: "Doctor",  text: "And on a scale of 1–10, how would you rate them at their worst?", t: "00:56" },
  { spk: "Patient", text: "Maybe a 6. They fade after coffee and breakfast.", t: "01:04" },
  { spk: "Doctor",  text: "Any nausea, vision changes, or photosensitivity?", t: "01:11" },
  { spk: "Patient", text: "Some sensitivity to light. No nausea.", t: "01:18" },
];

// ----------------------------- Page -----------------------------
function TelePage() {
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [drawer, setDrawer] = useState<null | "rx" | "followup" | "summary">(null);
  const [tab, setTab] = useState<"notes" | "transcript" | "chat">("notes");
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const seconds = useTimer();

  return (
    <div className="animate-fade-in-up">
      {/* Top status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-destructive">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60 animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-destructive" />
            </span>
            Live
          </span>
          <div className="h-4 w-px bg-border" />
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight truncate">
              {patient.name} · {patient.age}{patient.sex} · {patient.reason}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1"><Lock className="size-3" /> End-to-end encrypted</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3 text-success" /> HIPAA secure room</span>
              <span>·</span>
              <span className="tabular-nums">Session ID TM-7842-A</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionPill />
          <div className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm tabular-nums">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="font-medium">{formatTime(seconds)}</span>
          </div>
          <button className="size-9 rounded-lg border border-border bg-card hover:bg-secondary inline-flex items-center justify-center" aria-label="More">
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        {/* Stage + controls + bottom panel */}
        <div className="space-y-5 min-w-0">
          <Stage
            camOn={camOn} muted={muted} sharing={sharing} captions={captions}
          />

          {/* Control bar */}
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
               style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2">
              <CtrlBtn label={muted ? "Unmute" : "Mute"} active={!muted} onClick={() => setMuted(v => !v)} icon={muted ? MicOff : Mic} danger={muted} />
              <CtrlBtn label={camOn ? "Stop video" : "Start video"} active={camOn} onClick={() => setCamOn(v => !v)} icon={camOn ? VideoIcon : VideoOff} danger={!camOn} />
              <CtrlBtn label={sharing ? "Stop sharing" : "Share screen"} active={sharing} onClick={() => setSharing(v => !v)} icon={MonitorUp} />
              <CtrlBtn label={captions ? "Hide captions" : "Show captions"} active={captions} onClick={() => setCaptions(v => !v)} icon={Captions} />
              <div className="hidden md:block h-6 w-px bg-border mx-1" />
              <button className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm border border-border bg-card hover:bg-secondary">
                <Users className="size-4" /> Invite
              </button>
              <button className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm border border-border bg-card hover:bg-secondary">
                <Settings className="size-4" /> Devices
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setDrawer("rx")} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary">
                <Pill className="size-4 text-primary" /> Prescribe
              </button>
              <button onClick={() => setDrawer("followup")} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary">
                <CalendarPlus className="size-4 text-primary" /> Follow-up
              </button>
              <button onClick={() => setDrawer("summary")} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}>
                <Sparkles className="size-4" /> Generate summary
              </button>
              <div className="h-6 w-px bg-border mx-1" />
              <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-destructive-foreground bg-destructive hover:opacity-90">
                <PhoneOff className="size-4" /> End
              </button>
            </div>
          </div>

          {/* Bottom workspace: notes / transcript / chat */}
          <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between border-b border-border px-2">
              <div className="flex">
                <TabBtn active={tab === "notes"} onClick={() => setTab("notes")} icon={ClipboardList} label="Consultation notes" />
                <TabBtn active={tab === "transcript"} onClick={() => setTab("transcript")} icon={Sparkles} label="AI transcript" badge="Live" />
                <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquare} label="In-call chat" badge={`${messages.length}`} />
              </div>
              <div className="text-[11px] text-muted-foreground pr-3 hidden md:flex items-center gap-1.5">
                <Lock className="size-3" /> Auto-saved to patient chart
              </div>
            </div>

            <div className="p-5 min-h-[280px]">
              {tab === "notes" && <NotesPanel />}
              {tab === "transcript" && <TranscriptPanel />}
              {tab === "chat" && (
                <ChatPanel
                  messages={messages}
                  draft={draft}
                  setDraft={setDraft}
                  onSend={() => {
                    if (!draft.trim()) return;
                    setMessages(m => [...m, { from: "doctor", text: draft.trim(), at: formatTime(seconds) }]);
                    setDraft("");
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: patient medical history */}
        <aside className="space-y-5">
          <PatientCard />
          <FilesCard />
          <SoapTeaser />
        </aside>
      </div>

      {/* Drawer */}
      {drawer && <Drawer kind={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

// ----------------------------- Stage -----------------------------
function Stage({ camOn, muted, sharing, captions }: { camOn: boolean; muted: boolean; sharing: boolean; captions: boolean }) {
  return (
    <div className="relative rounded-xl border border-border overflow-hidden bg-[oklch(0.16_0.03_240)]"
         style={{ boxShadow: "var(--shadow-card)", aspectRatio: "16 / 9" }}>
      {/* Patient (main) feed */}
      <div className="absolute inset-0">
        <FauxVideo label="Patient" name={patient.name} initials="MC" hue={200} />
      </div>

      {/* Top overlays */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/95 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
            <span className="size-1.5 rounded-full bg-destructive animate-pulse" /> REC
          </span>
          {sharing && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/95 bg-primary/80 px-2 py-1 rounded-md">
              <MonitorUp className="size-3" /> Sharing labs.pdf
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

      {/* Patient nameplate */}
      <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 bg-black/45 backdrop-blur-md text-white/95 px-2.5 py-1.5 rounded-md text-xs">
        <span className="font-medium">{patient.name}</span>
        <span className="opacity-70">· Patient</span>
        {muted && <MicOff className="size-3.5 text-destructive" />}
      </div>

      {/* Captions */}
      {captions && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[80%]">
          <div className="text-center text-sm text-white bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-md">
            <span className="opacity-70">Patient: </span>
            They mostly happen in the morning, behind my eyes.
          </div>
        </div>
      )}

      {/* Doctor PiP */}
      <div className="absolute bottom-4 right-4 w-44 sm:w-56 aspect-video rounded-lg overflow-hidden ring-2 ring-white/15 shadow-xl">
        {camOn ? (
          <FauxVideo label="You" name="Dr. Okafor" initials="AO" hue={170} />
        ) : (
          <div className="w-full h-full bg-[oklch(0.18_0.03_240)] flex flex-col items-center justify-center text-white/80">
            <VideoOff className="size-6 mb-1" />
            <span className="text-[11px]">Camera off</span>
          </div>
        )}
        <div className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 bg-black/55 px-1.5 py-0.5 rounded text-[10px] text-white">
          You · Dr. Okafor
          {muted && <MicOff className="size-3 text-destructive ml-1" />}
        </div>
      </div>
    </div>
  );
}

function FauxVideo({ name, initials, hue }: { label: string; name: string; initials: string; hue: number }) {
  return (
    <div
      className="w-full h-full relative"
      style={{
        background: `radial-gradient(120% 80% at 50% 30%, oklch(0.45 0.08 ${hue}) 0%, oklch(0.22 0.05 ${hue}) 60%, oklch(0.14 0.03 ${hue}) 100%)`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-28 sm:size-36 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/15 flex items-center justify-center text-white text-3xl sm:text-4xl font-semibold tracking-tight">
          {initials}
        </div>
      </div>
      <div className="absolute inset-0 opacity-[0.07]"
           style={{ backgroundImage: "var(--grid-bg)", backgroundSize: "24px 24px" }} />
      <span className="sr-only">{name} video feed</span>
    </div>
  );
}

// ----------------------------- Controls -----------------------------
function CtrlBtn({
  icon: Icon, label, active, danger, onClick,
}: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "size-10 rounded-lg inline-flex items-center justify-center border transition",
        danger
          ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15"
          : active
            ? "bg-secondary text-foreground border-border hover:bg-secondary/80"
            : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function ConnectionPill() {
  return (
    <div className="h-9 px-3 rounded-lg border border-border bg-card inline-flex items-center gap-2 text-xs">
      <Signal className="size-3.5 text-success" />
      <span className="font-medium text-foreground">Excellent</span>
      <span className="text-muted-foreground tabular-nums">· 38 ms · 1080p</span>
    </div>
  );
}

function TabBtn({
  icon: Icon, label, active, onClick, badge,
}: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; onClick?: () => void; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 px-4 py-3 text-sm transition",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
      {badge && (
        <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded",
          active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
          {badge}
        </span>
      )}
      {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-primary" />}
    </button>
  );
}

// ----------------------------- Panels -----------------------------
function NotesPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <div className="label-eyebrow mb-2">Live consultation note</div>
        <textarea
          defaultValue={`Chief complaint: morning headaches × 3 weeks, 2–3/week.\nReports photosensitivity, no nausea or aura. Home BP avg 128/82.\nReviewing lipid panel — LDL 118.`}
          className="w-full min-h-[180px] rounded-lg border border-border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
        />
        <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CircleDot className="size-3 text-success" /> Auto-saved 2s ago</span>
          <span>1,284 chars</span>
        </div>
      </div>
      <div>
        <div className="label-eyebrow mb-2">Quick SOAP</div>
        <div className="rounded-lg border border-border divide-y divide-border text-sm">
          {[
            ["S", "Morning headaches × 3 wks, photosensitivity"],
            ["O", "BP 128/82 (home avg), SpO₂ 98%"],
            ["A", "Likely tension-type headache; HTN controlled"],
            ["P", "Trial sleep hygiene + hydration; recheck 4 wks"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3 px-3 py-2.5">
              <span className="text-[11px] font-semibold text-primary w-4 mt-0.5">{k}</span>
              <span className="text-foreground/85 flex-1">{v}</span>
              <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="size-4" /></button>
            </div>
          ))}
        </div>
        <button className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
          <Plus className="size-3.5" /> Add structured field
        </button>
      </div>
    </div>
  );
}

function TranscriptPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          AI transcription · diarization on · medical model v2.4
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 text-success">
            <span className="size-1.5 rounded-full bg-success animate-pulse" /> Listening
          </span>
          <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <Download className="size-3.5" /> Export
          </button>
        </div>
      </div>
      <ol className="space-y-3">
        {transcript.map((row, i) => (
          <li key={i} className="flex gap-3">
            <span className="tabular-nums text-[11px] text-muted-foreground w-12 pt-0.5">{row.t}</span>
            <div className="flex-1">
              <div className={cn("text-[11px] font-semibold uppercase tracking-wider",
                row.spk === "Doctor" ? "text-primary" : "text-foreground/70")}>
                {row.spk}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{row.text}</p>
            </div>
          </li>
        ))}
        <li className="flex gap-3 opacity-70">
          <span className="tabular-nums text-[11px] text-muted-foreground w-12 pt-0.5">…</span>
          <div className="flex-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="size-1.5 rounded-full bg-primary animate-pulse [animation-delay:200ms]" />
            <span className="size-1.5 rounded-full bg-primary animate-pulse [animation-delay:400ms]" />
            transcribing…
          </div>
        </li>
      </ol>
    </div>
  );
}

function ChatPanel({
  messages, draft, setDraft, onSend,
}: { messages: typeof initialMessages; draft: string; setDraft: (v: string) => void; onSend: () => void }) {
  return (
    <div className="flex flex-col h-[300px]">
      <ul className="flex-1 overflow-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <li key={i} className={cn("flex", m.from === "doctor" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              m.from === "doctor"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-secondary text-secondary-foreground rounded-bl-md")}>
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
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
          placeholder="Type a secure message…"
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={onSend}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}>
          <Send className="size-3.5" /> Send
        </button>
      </div>
      <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
        <Lock className="size-3" /> Messages are encrypted and attached to the encounter.
      </div>
    </div>
  );
}

// ----------------------------- Sidebar -----------------------------
function PatientCard() {
  return (
    <div className="rounded-xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-semibold">MC</div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight truncate">{patient.name}</div>
          <div className="text-xs text-muted-foreground truncate">{patient.age} · {patient.sex} · {patient.mrn}</div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          <Lock className="size-3" /> PHI
        </span>
      </div>
      <div className="p-5 space-y-4">
        <Row icon={Droplet} label="Blood group" value={patient.bloodGroup} accent="text-destructive" />
        <Row icon={Stethoscope} label="Last visit" value={patient.lastVisit} />
        <div>
          <div className="label-eyebrow mb-2 flex items-center gap-1.5"><AlertTriangle className="size-3 text-destructive" /> Allergies</div>
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies.map(a => (
              <span key={a} className="text-[11px] px-2 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/15">{a}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="label-eyebrow mb-2 flex items-center gap-1.5"><Activity className="size-3 text-primary" /> Active conditions</div>
          <div className="flex flex-wrap gap-1.5">
            {patient.conditions.map(c => (
              <span key={c} className="text-[11px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{c}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="label-eyebrow mb-2 flex items-center gap-1.5"><Pill className="size-3 text-primary" /> Current meds</div>
          <ul className="text-xs text-foreground/85 space-y-1">
            {patient.medications.map(m => <li key={m} className="flex gap-2"><span className="text-muted-foreground">·</span>{m}</li>)}
          </ul>
        </div>
        <a href="#" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          Open full chart <ChevronRight className="size-3.5" />
        </a>
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

function FilesCard() {
  return (
    <div className="rounded-xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Uploaded files</h3>
        </div>
        <button className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
          <Plus className="size-3.5" /> Upload
        </button>
      </div>
      <ul className="divide-y divide-border">
        {files.map((f) => (
          <li key={f.name} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition">
            <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <f.icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{f.name}</div>
              <div className="text-[11px] text-muted-foreground">{f.size} · shared with patient</div>
            </div>
            <button className="text-xs text-primary font-medium hover:underline">Share</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SoapTeaser() {
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" /> AI assist ready
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
        I'll draft a SOAP note, prescription, and follow-up plan from this session. Review required before signing.
      </p>
      <button className="mt-3 w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}>
        <FileSignature className="size-4" /> Draft encounter
      </button>
    </div>
  );
}

// ----------------------------- Drawer -----------------------------
function Drawer({ kind, onClose }: { kind: "rx" | "followup" | "summary"; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="w-full max-w-[440px] bg-card border-l border-border h-full overflow-auto animate-fade-in-up"
             style={{ boxShadow: "var(--shadow-glow)" }}>
        <header className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <div className="label-eyebrow">{kind === "rx" ? "Prescription" : kind === "followup" ? "Follow-up" : "Summary"}</div>
            <h2 className="text-base font-semibold tracking-tight mt-0.5">
              {kind === "rx" && "Prescription builder"}
              {kind === "followup" && "Schedule follow-up"}
              {kind === "summary" && "Consultation summary"}
            </h2>
          </div>
          <button onClick={onClose} className="size-8 rounded-md hover:bg-secondary inline-flex items-center justify-center" aria-label="Close">
            <X className="size-4" />
          </button>
        </header>

        <div className="p-5 space-y-5">
          {kind === "rx" && <RxDrawer />}
          {kind === "followup" && <FollowUpDrawer />}
          {kind === "summary" && <SummaryDrawer />}
        </div>

        <footer className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3 text-success" /> Will sync to patient chart on save
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-3 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button className="h-9 px-3 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              {kind === "rx" ? "Sign & send" : kind === "followup" ? "Schedule" : "Save to chart"}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function RxDrawer() {
  return (
    <>
      <Field label="Medication">
        <input defaultValue="Lisinopril 10 mg tablet" className="rx-input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dose"><input defaultValue="1 tablet" className="rx-input" /></Field>
        <Field label="Frequency"><input defaultValue="Once daily" className="rx-input" /></Field>
        <Field label="Duration"><input defaultValue="90 days" className="rx-input" /></Field>
        <Field label="Refills"><input defaultValue="3" className="rx-input" /></Field>
      </div>
      <Field label="Instructions">
        <textarea defaultValue="Take in the morning with water. Recheck BP in 4 weeks." className="rx-input min-h-[80px]" />
      </Field>
      <div className="rounded-lg border border-warning/30 bg-warning/10 text-warning text-xs px-3 py-2 flex items-center gap-2">
        <AlertTriangle className="size-3.5" /> Interaction check passed · no conflicts with current meds
      </div>
      <Field label="Pharmacy"><input defaultValue="Walgreens · 1850 Polk St, SF" className="rx-input" /></Field>
      <style>{`.rx-input{width:100%;border:1px solid var(--border);background:var(--background);border-radius:.5rem;padding:.55rem .7rem;font-size:.875rem;outline:none}.rx-input:focus{box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 30%, transparent)}`}</style>
    </>
  );
}

function FollowUpDrawer() {
  const slots = ["Mon Jun 8 · 09:30", "Tue Jun 9 · 14:00", "Wed Jun 10 · 11:15", "Fri Jun 12 · 09:30", "Mon Jun 15 · 16:00", "Tue Jun 16 · 10:45"];
  return (
    <>
      <Field label="Visit type">
        <select className="rx-input">
          <option>Telehealth follow-up (15 min)</option>
          <option>In-person follow-up (30 min)</option>
          <option>Lab draw only</option>
        </select>
      </Field>
      <Field label="Suggested slots">
        <div className="grid grid-cols-2 gap-2">
          {slots.map((s, i) => (
            <button key={s} className={cn("text-sm text-left px-3 py-2 rounded-lg border transition",
              i === 3 ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary")}>
              {s}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Pre-visit instructions">
        <textarea defaultValue="Continue home BP log. Bring updated headache diary." className="rx-input min-h-[80px]" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" defaultChecked className="size-4 accent-[var(--primary)]" />
        Send SMS + email reminders 24h before
      </label>
      <style>{`.rx-input{width:100%;border:1px solid var(--border);background:var(--background);border-radius:.5rem;padding:.55rem .7rem;font-size:.875rem;outline:none}`}</style>
    </>
  );
}

function SummaryDrawer() {
  return (
    <>
      <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" /> AI-generated draft
        </div>
        <p className="text-sm leading-relaxed mt-2 text-foreground/90">
          42-year-old female presented via telehealth for follow-up on morning headaches and hypertension review. Home BP averages 128/82. Headaches reported 2–3×/week, photosensitivity, no nausea. Lipid panel reviewed — LDL 118 mg/dL, borderline.
        </p>
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
          <Sparkles className="size-3" /> Draft only — clinician must review before signing.
        </p>
      </div>
      <Field label="Assessment & plan">
        <textarea
          defaultValue={`Assessment:\n- Likely tension-type headache, sleep-related.\n- Essential hypertension, well controlled.\n- Borderline hyperlipidemia.\n\nPlan:\n- Sleep hygiene + hydration trial × 4 weeks.\n- Continue Lisinopril 10 mg qd.\n- Repeat lipid panel in 6 months.\n- Follow-up telehealth Jun 12.`}
          className="rx-input min-h-[180px] font-mono text-[12px] leading-relaxed"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <button className="inline-flex items-center justify-center gap-2 h-9 rounded-lg text-sm border border-border hover:bg-secondary">
          <Download className="size-4" /> Export PDF
        </button>
        <button className="inline-flex items-center justify-center gap-2 h-9 rounded-lg text-sm border border-border hover:bg-secondary">
          <Send className="size-4" /> Send to patient
        </button>
      </div>
      <style>{`.rx-input{width:100%;border:1px solid var(--border);background:var(--background);border-radius:.5rem;padding:.55rem .7rem;font-size:.875rem;outline:none}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-eyebrow block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// ----------------------------- Utils -----------------------------
function useTimer() {
  const [s, setS] = useState(742);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    ref.current = window.setInterval(() => setS((v) => v + 1), 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, []);
  return s;
}
function formatTime(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Suppress unused import warnings for icons reserved for future controls
void useMemo; void CtrlBtn;