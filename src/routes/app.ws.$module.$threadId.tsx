import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Copy, LayoutGrid, PanelLeftClose, PanelLeftOpen, Plus, SlidersHorizontal, Square, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COURSES, HUBS, OPPORTUNITIES, PEOPLE, SIMULATIONS, TRENDS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { CARD_LABELS, isWorkspaceId, WORKSPACES, type CardKind, type WorkspaceConfig } from "@/lib/workspaces";
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
  const [mode, setMode] = useState<string>(thread.mode ?? w.modes[0]!);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!busy) taRef.current?.focus(); }, [busy]);

  const context = [
    `Workspace: ${w.label}. Session focus chosen during onboarding: ${thread.focus}. Active mode: ${mode}.`,
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
        body: JSON.stringify({ module: w.id, context, messages: next.filter((m) => !m.card && m.content).map(({ role, content }) => ({ role, content })) }),
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
      onChange({ ...thread, title, mode, messages: next, updatedAt: Date.now() });
      setBusy(false);
      abortRef.current = null;
    }
  };

  const insertCard = (card: CardKind) => {
    setToolsOpen(false);
    const next = [...messages, { id: newId(), role: "assistant" as const, content: "", card }];
    setMessages(next);
    onChange({ ...thread, mode, messages: next, updatedAt: Date.now() });
  };
  const pickMode = (m: string) => { setMode(m); setToolsOpen(false); onChange({ ...thread, mode: m, messages, updatedAt: Date.now() }); };
  const copy = (m: WsMessage) => { navigator.clipboard?.writeText(m.content); setCopied(m.id); setTimeout(() => setCopied(null), 1500); };

  const empty = messages.length === 0;

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        {!sidebarOpen && <button aria-label="Show history" onClick={openSidebar} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><PanelLeftOpen className="h-4 w-4" /></button>}
        <w.icon className="h-4 w-4 text-gold" strokeWidth={1.6} />
        <span className="truncate text-sm font-medium"><span className="text-muted-foreground">{w.agent} · </span>{thread.title}</span>
        <span className="ml-auto rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs">{mode}</span>
        <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">{thread.focus}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          {empty ? (
            <div className="pt-[12vh] text-center">
              <div className="flex justify-center"><AgentMark w={w} size="lg" /></div>
              <p className="eyebrow mt-4">{w.agent}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">How can I help with {thread.focus}?</h2>
              <p className="mt-2 text-sm text-muted-foreground">{w.welcomeBody}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m) => m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="group flex gap-3">
                  <AgentMark w={w} size="sm" />
                  <div className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                    {m.card ? <InlineCard kind={m.card} onPick={send} disabled={busy} /> : m.content ? (
                      <>
                        <div className="ws-md"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                        <button onClick={() => copy(m)} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                          {copied === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied === m.id ? "Copied" : "Copy"}
                        </button>
                      </>
                    ) : <span className="animate-pulse text-muted-foreground">Thinking…</span>}
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
          <Popover open={toolsOpen} onOpenChange={setToolsOpen}>
            <PopoverTrigger asChild>
              <Button type="button" size="icon" variant="ghost" aria-label="Tools"><SlidersHorizontal className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-64 p-2">
              <p className="px-2 pb-1 pt-1 text-xs font-medium text-muted-foreground">Mode</p>
              {w.modes.map((m) => (
                <button key={m} type="button" onClick={() => pickMode(m)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                  {m} {mode === m && <Check className="h-3.5 w-3.5 text-gold" />}
                </button>
              ))}
              <p className="mt-2 border-t px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">Show in chat</p>
              {w.cards.map((c) => (
                <button key={c} type="button" onClick={() => insertCard(c)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                  <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" /> {CARD_LABELS[c]}
                </button>
              ))}
            </PopoverContent>
          </Popover>
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

function InlineCard({ kind, onPick, disabled }: { kind: CardKind; onPick: (q: string) => void; disabled: boolean }) {
  const { competencies } = useApp();
  const item = "w-full rounded-xl border bg-background p-3 text-left transition-colors hover:border-gold/60 disabled:opacity-50";
  return (
    <div className="rounded-2xl border bg-surface/60 p-3">
      <p className="eyebrow mb-2">{CARD_LABELS[kind]}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {kind === "skills" && [...competencies].sort((a, b) => a.level - b.level).slice(0, 6).map((c) => (
          <button key={c.id} disabled={disabled} className={item} onClick={() => onPick(`Help me improve ${c.name} (currently ${c.state}, ${c.level}%).`)}>
            <span className="block text-sm font-medium">{c.name}</span>
            <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-border"><span className="block h-full bg-gold" style={{ width: `${c.level}%` }} /></span>{c.state} · {c.level}%
            </span>
          </button>
        ))}
        {kind === "sims" && SIMULATIONS.slice(0, 8).map((s) => (
          <button key={s.id} disabled={disabled} className={item} onClick={() => onPick(`Run the "${s.title}" scenario with me: ${s.summary} Play the other party and wait for my responses.`)}>
            <span className="block text-sm font-medium">{s.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{s.difficulty} · {s.duration}</span>
          </button>
        ))}
        {kind === "trends" && TRENDS.map((t) => (
          <button key={t.id} disabled={disabled} className={item} onClick={() => onPick(`Brief me on "${t.name}": ${t.note} What does it mean for my career?`)}>
            <span className="block text-sm font-medium">{t.name} <span className="text-xs text-cyan">{t.change}</span></span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{t.impact}</span>
          </button>
        ))}
        {kind === "courses" && COURSES.map((c) => (
          <button key={c.id} disabled={disabled} className={item} onClick={() => onPick(`Teach me the first lesson of "${c.title}" (${c.skills.join(", ")}).`)}>
            <span className="block text-sm font-medium">{c.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{c.modules} modules · {c.progress}% done</span>
          </button>
        ))}
        {kind === "people" && PEOPLE.slice(0, 6).map((p) => (
          <button key={p.id} disabled={disabled} className={item} onClick={() => onPick(`Help me connect with ${p.name}, ${p.role} at ${p.organisation}. Write a short connection request.`)}>
            <span className="block text-sm font-medium">{p.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{p.role} · {p.organisation}</span>
          </button>
        ))}
        {kind === "jobs" && OPPORTUNITIES.slice(0, 6).map((o) => (
          <button key={o.id} disabled={disabled} className={item} onClick={() => onPick(`Help me apply for "${o.title}" at ${o.org} (${o.location}). ${o.description} Required skills: ${o.skills.join(", ")}.`)}>
            <span className="block text-sm font-medium">{o.title} <span className="text-xs text-gold">{o.match}% match</span></span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{o.org} · {o.type} · closes {o.deadline}</span>
          </button>
        ))}
        {kind === "hubs" && HUBS.map((h) => (
          <button key={h.id} disabled={disabled} className={item} onClick={() => onPick(`Tell me about the "${h.programme}" in ${h.destination} (${h.focus}) and how to prepare.`)}>
            <span className="block text-sm font-medium">{h.programme}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{h.destination} · {h.status} · next {h.next}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Tap any item to continue in chat.</p>
    </div>
  );
}

export function AgentMark({ w, size }: { w: WorkspaceConfig; size: "sm" | "lg" }) {
  const box = size === "sm" ? "h-7 w-7" : "h-16 w-16";
  if (w.logo) return <img src={w.logo} alt={`${w.agent} logo`} width={size === "sm" ? 28 : 64} height={size === "sm" ? 28 : 64} className={cn(box, "shrink-0 object-contain")} />;
  return <span className={cn(box, "mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan/20 to-gold/20")}><w.icon className={size === "sm" ? "h-3.5 w-3.5" : "h-7 w-7"} /></span>;
}
