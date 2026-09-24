import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Loader2, MessageSquare } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/tw/member-avatar";
import { supabase } from "@/integrations/supabase/client";
import { displayName, fetchInbox, fetchMember, markRead, MEMBER_COLS, ROLE_LABEL, sendDM, timeAgo, type DM, type Member } from "@/lib/social";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/messages")({
  validateSearch: z.object({ to: z.string().uuid().optional() }),
  head: () => ({ meta: [
    { title: "Messages — Tourism Workforce 2031" },
    { name: "description", content: "Private messages with tourism professionals." },
    { property: "og:title", content: "Messages — Tourism Workforce 2031" },
    { property: "og:description", content: "Private messages with tourism professionals." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: Messages,
});

function Messages() {
  const { to } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inbox, setInbox] = useState<DM[] | null>(null);
  const [people, setPeople] = useState<Record<string, Member>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try { setInbox(await fetchInbox(user.id)); } catch (e) { toast.error((e as Error).message); setInbox([]); }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  // Live updates for new messages.
  useEffect(() => {
    if (!user) return;
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [user, load]);

  const threads = useMemo(() => {
    if (!user || !inbox) return [] as { other: string; last: DM; unread: number }[];
    const map = new Map<string, { other: string; last: DM; unread: number }>();
    for (const m of inbox) {
      const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const cur = map.get(other) ?? { other, last: m, unread: 0 };
      cur.last = m;
      if (m.recipient_id === user.id && !m.read_at) cur.unread++;
      map.set(other, cur);
    }
    return [...map.values()].sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  }, [inbox, user]);

  const ids = useMemo(() => [...new Set([...threads.map((t) => t.other), ...(to ? [to] : [])])], [threads, to]);
  useEffect(() => {
    const missing = ids.filter((i) => !people[i]);
    if (!missing.length) return;
    supabase.from("profiles").select(MEMBER_COLS).in("id", missing).then(({ data }) => {
      setPeople((p) => ({ ...p, ...Object.fromEntries(((data ?? []) as Member[]).map((m) => [m.id, m])) }));
    });
  }, [ids, people]);

  const active = to ?? null;
  const convo = useMemo(() => (inbox ?? []).filter((m) => active && (m.sender_id === active || m.recipient_id === active)), [inbox, active]);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [convo.length]);
  useEffect(() => {
    if (user && active && convo.some((m) => m.recipient_id === user.id && !m.read_at)) markRead(user.id, active).then(load);
  }, [user, active, convo, load]);
  useEffect(() => { if (active && !people[active]) fetchMember(active).then((m) => m && setPeople((p) => ({ ...p, [m.id]: m }))); }, [active, people]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !active || !text.trim()) return;
    setSending(true);
    try { await sendDM(user.id, active, text.trim()); setText(""); await load(); } catch (err) { toast.error((err as Error).message); } finally { setSending(false); }
  };

  if (!user) return null;
  const other = active ? people[active] : null;

  return (
    <div className="grid h-[calc(100vh-9rem)] min-h-[520px] overflow-hidden rounded-2xl border bg-card shadow-sm md:grid-cols-[300px_1fr]">
      <aside className={cn("flex flex-col border-r", active && "hidden md:flex")}>
        <div className="border-b px-4 py-3"><p className="font-display font-semibold">Messages</p></div>
        <div className="flex-1 overflow-y-auto">
          {inbox === null ? <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin" /></div>
            : threads.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No conversations yet. Open a member's profile and tap Message.</p>
            : threads.map((t) => (
              <button key={t.other} onClick={() => navigate({ to: "/app/messages", search: { to: t.other } })} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent", active === t.other && "bg-accent")}>
                <MemberAvatar m={people[t.other]} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2"><span className="truncate text-sm font-medium">{displayName(people[t.other])}</span><span className="shrink-0 text-xs text-muted-foreground">{timeAgo(t.last.created_at)}</span></span>
                  <span className={cn("block truncate text-xs", t.unread ? "font-semibold text-foreground" : "text-muted-foreground")}>{t.last.sender_id === user.id ? "You: " : ""}{t.last.body}</span>
                </span>
                {t.unread > 0 && <span className="h-2 w-2 rounded-full bg-gold" />}
              </button>
            ))}
        </div>
      </aside>
      <section className={cn("flex min-w-0 flex-col", !active && "hidden md:flex")}>
        {!active ? (
          <div className="m-auto text-center text-muted-foreground"><MessageSquare className="mx-auto h-8 w-8" /><p className="mt-2 text-sm">Select a conversation</p></div>
        ) : <>
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <button className="text-sm text-muted-foreground md:hidden" onClick={() => navigate({ to: "/app/messages", search: {} })}>←</button>
            <MemberAvatar m={other} size="sm" />
            <div className="min-w-0">
              <Link to="/app/people/$id" params={{ id: active }} className="block truncate text-sm font-semibold hover:underline">{displayName(other)}</Link>
              <p className="truncate text-xs text-muted-foreground">{other?.headline || ROLE_LABEL[other?.role ?? ""] || ""}</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {convo.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Say hello to {displayName(other)}.</p>}
            {convo.map((m) => (
              <div key={m.id} className={cn("flex", m.sender_id === user.id ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm", m.sender_id === user.id ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-surface-2")}>{m.body}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-3">
            <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }} rows={1} maxLength={2000} placeholder="Write a message…" className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border bg-surface px-3 py-2 text-sm outline-none focus:border-gold" autoFocus />
            <Button type="submit" size="icon" aria-label="Send" disabled={sending || !text.trim()}><ArrowUp className="h-4 w-4" /></Button>
          </form>
        </>}
      </section>
    </div>
  );
}
