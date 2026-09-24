import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, PanelLeftClose, PanelLeftOpen, Plus, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWorkspaceId, WORKSPACES, type WorkspaceConfig } from "@/lib/workspaces";
import { deleteThread, loadThreads, newId, upsertThread, type WsMessage, type WsThread } from "@/lib/ws-threads";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/ws/$module/$threadId")({
  beforeLoad: ({ params }) => { if (!isWorkspaceId(params.module)) throw notFound(); },
  head: ({ params }) => {
    const w = isWorkspaceId(params.module) ? WORKSPACES[params.module] : null;
    const t = `${w?.label ?? "Workspace"} chat — Tourism Workforce 2031`;
    return { meta: [{ title: t }, { name: "description", content: "Chat workspace" }, { property: "og:title", content: t }, { property: "og:description", content: "Chat workspace" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] };
  },
  component: WorkspacePage,
});

function WorkspacePage() {
  const { module, threadId } = Route.useParams();
  const w = WORKSPACES[module as keyof typeof WORKSPACES];
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<WsThread[]>([]);
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    setThreads(loadThreads(user.id).filter((t) => t.module === w.id));
    setReady(true);
  }, [user, w.id, threadId]);

  const thread = threads.find((t) => t.id === threadId);
  useEffect(() => {
    if (ready && !thread) navigate({ to: "/app/ws/$module", params: { module: w.id }, replace: true });
  }, [ready, thread, navigate, w.id]);

  const onChange = (t: WsThread) => {
    if (!user) return;
    upsertThread(user.id, t);
    setThreads((prev) => [t, ...prev.filter((x) => x.id !== t.id)]);
  };
  const remove = (id: string) => {
    if (!user) return;
    deleteThread(user.id, id);
    const rest = threads.filter((t) => t.id !== id);
    setThreads(rest);
    if (id === threadId) {
      const next = rest[0];
      if (next) navigate({ to: "/app/ws/$module/$threadId", params: { module: w.id, threadId: next.id } });
      else navigate({ to: "/app/ws/$module", params: { module: w.id } });
    }
  };

  return (
    <div className="fade-up -mx-4 -my-8 flex h-[calc(100vh-4rem)] overflow-hidden border-t md:-mx-8 md:-my-10">
      <aside className={cn("shrink-0 flex-col border-r bg-surface/60 transition-all", open ? "flex w-64" : "hidden w-0")}>
        <div className="flex items-center justify-between p-3">
          <span className="eyebrow">{w.label} history</span>
          <button aria-label="Hide history" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><PanelLeftClose className="h-4 w-4" /></button>
        </div>
        <div className="px-3 pb-2">
          <Button asChild variant="outline" size="sm" className="w-full justify-start">
            <Link to="/app/ws/$module" params={{ module: w.id }}><Plus className="mr-1 h-4 w-4" /> New chat</Link>
          </Button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {[...threads].sort((a, b) => b.updatedAt - a.updatedAt).map((t) => (
            <div key={t.id} className={cn("group flex items-center rounded-lg", t.id === threadId ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60")}>
              <Link to="/app/ws/$module/$threadId" params={{ module: w.id, threadId: t.id }} className="min-w-0 flex-1 px-3 py-2">
                <span className={cn("block truncate text-sm", t.id === threadId && "font-medium")}>{t.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.focus}</span>
              </Link>
              <button aria-label="Delete chat" onClick={() => remove(t.id)} className="mr-1 rounded p-1.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <Link to={w.classic} className="text-xs text-muted-foreground hover:text-foreground">Open {w.classicLabel.toLowerCase()} →</Link>
        </div>
      </aside>
      {thread ? <ChatCanvas key={thread.id} w={w} thread={thread} onChange={onChange} sidebarOpen={open} openSidebar={() => setOpen(true)} /> : <div className="flex-1" />}
    </div>
  );
}

function ChatCanvas({ w, thread, onChange, sidebarOpen, openSidebar }: { w: WorkspaceConfig; thread: WsThread; onChange: (t: WsThread) => void; sidebarOpen: boolean; openSidebar: () => void }) {
  const { persona, competencies } = useApp();
  const [messages, setMessages] = useState<WsMessage[]>(thread.messages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!busy) taRef.current?.focus(); }, [busy]);

  const context = [
    `Workspace: ${w.label}. Session focus chosen during onboarding: ${thread.focus}.`,
    `Learner: ${persona.name} (${persona.role}). Goal: ${persona.goal}.`,
    `Skills: ${competencies.map((c) => `${c.name} ${c.state} ${c.level}%`).join("; ")}`,
  ].join("\n");

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const userMsg: WsMessage = { id: newId(), role: "user", content: q };
    const aId = newId();
    let acc = "";
    let next = [...messages, userMsg];
    setMessages([...next, { id: aId, role: "assistant", content: "" }]);
    setBusy(true);
    const title = messages.length === 0 ? q.slice(0, 48) : thread.title;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ module: w.id, context, messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || "The assistant couldn't respond right now.");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...next, { id: aId, role: "assistant", content: acc }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      if (acc) next = [...next, { id: aId, role: "assistant", content: acc }];
      setMessages(next);
      onChange({ ...thread, title, messages: next, updatedAt: Date.now() });
      setBusy(false);
      abortRef.current = null;
    }
  };

  const empty = messages.length === 0;

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        {!sidebarOpen && <button aria-label="Show history" onClick={openSidebar} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><PanelLeftOpen className="h-4 w-4" /></button>}
        <w.icon className="h-4 w-4 text-gold" strokeWidth={1.6} />
        <span className="truncate text-sm font-medium">{thread.title}</span>
        <span className="ml-auto rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">{thread.focus}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          {empty ? (
            <div className="pt-[12vh] text-center">
              <w.icon className="mx-auto h-10 w-10 text-gold" strokeWidth={1.3} />
              <h2 className="mt-4 font-display text-2xl font-semibold">How can I help with {thread.focus}?</h2>
              <p className="mt-2 text-sm text-muted-foreground">{w.welcomeBody}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m) => m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan/20 to-gold/20"><w.icon className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {m.content || <span className="animate-pulse text-muted-foreground">Thinking…</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {w.prompts.map((p) => (
            <button key={p} disabled={busy} onClick={() => send(p)} className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground disabled:opacity-50">{p}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="glass flex items-end gap-2 rounded-2xl border p-2 shadow-lg">
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={w.placeholder}
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          {busy ? (
            <Button type="button" size="icon" variant="outline" aria-label="Stop" onClick={() => abortRef.current?.abort()}><Square className="h-4 w-4" /></Button>
          ) : (
            <Button type="submit" size="icon" aria-label="Send" disabled={!input.trim()}><ArrowUp className="h-4 w-4" /></Button>
          )}
        </form>
      </div>
    </section>
  );
}
