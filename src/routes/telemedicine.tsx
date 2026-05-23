import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, MessageSquare } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/telemedicine")({ component: TelePage });

function TelePage() {
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);

  return (
    <div>
      <PageHeader
        eyebrow="Live session"
        title="Telemedicine"
        description="HD video consult · end-to-end encrypted · auto-saved to chart."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          {/* "Video" stage */}
          <div className="relative aspect-video w-full" style={{ background: "radial-gradient(120% 80% at 30% 20%, oklch(0.4 0.08 220) 0%, oklch(0.18 0.04 240) 60%, oklch(0.12 0.03 240) 100%)" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-32 rounded-full bg-primary/30 flex items-center justify-center text-primary-foreground text-3xl font-semibold backdrop-blur-md ring-4 ring-white/10">
                SW
              </div>
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="size-2 rounded-full bg-destructive animate-pulse" />
              <div className="text-xs text-white/85 font-medium">LIVE · 14:32</div>
            </div>
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/40 text-white backdrop-blur">
              Sam Whitaker
            </div>

            {/* Self preview */}
            <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-lg border border-white/20 overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.5 0.1 200), oklch(0.3 0.05 230))" }}>
              <div className="size-full flex items-center justify-center text-white/90 text-xs font-medium">You</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 p-4 bg-card border-t border-border">
            <button onClick={() => setMuted((m) => !m)} className={`size-11 rounded-full flex items-center justify-center ${muted ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"}`}>
              {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>
            <button onClick={() => setCamOn((c) => !c)} className={`size-11 rounded-full flex items-center justify-center ${!camOn ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"}`}>
              {camOn ? <VideoIcon className="size-5" /> : <VideoOff className="size-5" />}
            </button>
            <button className="size-11 rounded-full bg-secondary text-foreground hover:bg-secondary/70 flex items-center justify-center">
              <MonitorUp className="size-5" />
            </button>
            <button className="size-11 rounded-full bg-secondary text-foreground hover:bg-secondary/70 flex items-center justify-center">
              <MessageSquare className="size-5" />
            </button>
            <button className="h-11 px-5 rounded-full bg-destructive text-destructive-foreground flex items-center gap-2 font-medium">
              <PhoneOff className="size-4" /> End
            </button>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="font-semibold tracking-tight text-sm">Patient</div>
            <div className="text-sm mt-2">Sam Whitaker · 38M</div>
            <div className="text-xs text-muted-foreground">Reason: Migraine follow-up</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="font-semibold tracking-tight text-sm mb-2">Live notes</div>
            <textarea
              defaultValue={"Patient reports reduced frequency this week. Sumatriptan effective for acute episodes. Plan: continue current regimen, follow up in 4 weeks."}
              className="w-full h-40 text-sm bg-secondary rounded-lg p-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}