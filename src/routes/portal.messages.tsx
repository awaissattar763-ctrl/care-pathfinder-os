import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { MessageSquare, Send, Plus, Lock } from "lucide-react";
import {
  useConversations, useMessages, useSendMessage, useCreateConversation, useMyPatientId,
} from "@/hooks/portal-queries";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portal/messages")({ component: PortalMessages });

function PortalMessages() {
  const { data: pid } = useMyPatientId();
  const { data: convos } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const create = useCreateConversation();

  const active = useMemo(() => convos?.find((c) => c.id === activeId) ?? convos?.[0] ?? null, [convos, activeId]);
  useEffect(() => { if (!activeId && convos?.[0]) setActiveId(convos[0].id); }, [convos, activeId]);

  const startNew = async () => {
    if (!pid) return;
    const subject = window.prompt("Subject for new message:");
    if (!subject) return;
    const c = await create.mutateAsync({ patient_id: pid, subject });
    setActiveId(c.id);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><MessageSquare className="size-5 text-primary" /> Messages</h1>
        <button onClick={startNew} className="text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium inline-flex items-center gap-1">
          <Plus className="size-3.5" /> New
        </button>
      </header>

      <div className="grid md:grid-cols-[260px,1fr] gap-3">
        <aside className="rounded-xl border border-border bg-card overflow-hidden">
          {(convos ?? []).length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No conversations.</div>
          ) : (
            <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
              {(convos ?? []).map((c) => (
                <li key={c.id}>
                  <button onClick={() => setActiveId(c.id)}
                    className={`w-full text-left px-3 py-3 hover:bg-secondary/50 ${active?.id === c.id ? "bg-secondary" : ""}`}>
                    <div className="text-sm font-medium truncate">{c.subject}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {c.provider?.name ?? "Care team"} · {new Date(c.last_message_at).toLocaleDateString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div className="rounded-xl border border-border bg-card flex flex-col min-h-[60vh]">
          {active ? <Thread conversationId={active.id} subject={active.subject} /> :
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation</div>
          }
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1"><Lock className="size-3" /> All messages are encrypted and audit-logged.</p>
    </div>
  );
}

function Thread({ conversationId, subject }: { conversationId: string; subject: string }) {
  const { user } = useAuth();
  const { data: msgs } = useMessages(conversationId);
  const send = useSendMessage();
  const [body, setBody] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [msgs?.length]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await send.mutateAsync({ conversationId, body: body.trim() });
    setBody("");
  };

  return (
    <>
      <header className="px-4 py-3 border-b border-border">
        <div className="text-sm font-semibold">{subject}</div>
      </header>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[55vh]">
        {(msgs ?? []).map((m) => {
          const mine = m.sender_user_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div className={`text-[10px] mt-1 ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  {mine && m.read_at ? " · Read" : mine ? " · Sent" : ""}
                </div>
              </div>
            </div>
          );
        })}
        {(msgs ?? []).length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">No messages yet. Send the first one below.</div>
        )}
      </div>
      <form onSubmit={onSend} className="p-3 border-t border-border flex items-center gap-2">
        <input
          value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Type a secure message…"
          className="flex-1 h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button type="submit" disabled={!body.trim() || send.isPending}
          className="h-10 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm inline-flex items-center gap-1 disabled:opacity-50">
          <Send className="size-3.5" /> Send
        </button>
      </form>
    </>
  );
}