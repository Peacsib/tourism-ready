import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, StatePill, Tag } from "@/components/tw/motifs";
import { AIService, type TutorMode, type TutorReply } from "@/lib/ai-service";
import { ROLES, SIMULATIONS } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/tutor")({
  head: () => ({ meta: [{ title: "AI Smart Tutor — Tourism Workforce 2031" }, { name: "description", content: "Your intelligent learning companion for tourism and hospitality." }] }),
  validateSearch: (s: Record<string, unknown>): { skill?: string } => (typeof s["skill"] === "string" ? { skill: s["skill"] } : {}),
  component: Tutor,
});

const MODES: { id: TutorMode; hint: string }[] = [
  { id: "Ask", hint: "Ask about tourism & hospitality" },
  { id: "Learn", hint: "Request explanations" },
  { id: "Practise", hint: "Generate a scenario" },
  { id: "Review", hint: "Analyse mistakes" },
  { id: "Prepare", hint: "Prepare for a role" },
];

type Msg = { from: "user" | "ai"; text: string; reply?: TutorReply };

function Tutor() {
  const { persona, competencies, attempts } = useApp();
  const [mode, setMode] = useState<TutorMode>("Ask");
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: `Hello ${persona.firstName}. I know your goal is to ${persona.goal.charAt(0).toLowerCase() + persona.goal.slice(1)}. Ask me anything, or try: "I want to improve my hotel front-office skills."` },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const { skill } = Route.useSearch();
  const focus = skill ? competencies.find((c) => c.id === skill) : undefined;
  const seeded = useRef<string | null>(null);
  useEffect(() => {
    if (!focus || seeded.current === focus.id) return;
    seeded.current = focus.id;
    const key = focus.name.toLowerCase().split(" ")[0] ?? "";
    const ev = attempts.filter((a) => a.competencies.some((n) => n.toLowerCase().includes(key)));
    const avg = ev.length ? Math.round(ev.flatMap((a) => a.scores.map((x) => x.value)).reduce((t, v, _i, arr) => t + v / arr.length, 0)) : null;
    const sim = SIMULATIONS.find((x) => x.available && x.skills.some((k) => k.toLowerCase().includes(key)));
    setMode("Learn");
    setMsgs((m) => [...m, {
      from: "ai",
      text: `Let's focus on ${focus.name}. You're currently at ${focus.state} (${focus.level}%). Evidence so far: ${ev.length ? `${ev.length} simulation${ev.length > 1 ? "s" : ""}, ${avg}% average performance` : "no simulations yet"}. Recommended next action: ${sim ? `practise it in "${sim.title}", then add the result to your Skills Passport` : "work through a short course in Learning, then ask me for a practice scenario"}.`,
      reply: { text: "", action: sim ? { label: `Start ${sim.title}`, to: `/app/simulations/${sim.id}` } : { label: "Open Learning", to: "/app/learning" } } as TutorReply,
    }]);
  }, [focus, attempts]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, thinking]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text: t }]);
    setThinking(true);
    const reply = await AIService.respond(t, mode);
    setMsgs((m) => [...m, { from: "ai", text: reply.text, reply }]);
    setThinking(false);
  };

  const developing = competencies.filter((c) => c.state === "Developing" || c.state === "Practising").slice(0, 4);
  const last = attempts[0];

  return (
    <div>
      <PageHeader eyebrow="Learn · Practise" title="AI Smart Tutor" subtitle="Your intelligent learning companion for tourism and hospitality." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel className="flex h-[calc(100vh-15rem)] min-h-[520px] flex-col p-0 md:p-0">
          <div className="flex gap-1 overflow-x-auto border-b p-2" role="tablist">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={cn("shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors", mode === m.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
                title={m.hint}
              >
                {m.id}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
            {msgs.map((m, i) => (
              <div key={i} className={cn("fade-up flex gap-3", m.from === "user" && "justify-end")}>
                {m.from === "ai" && <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan/40 bg-cyan/10"><Bot className="h-3.5 w-3.5 text-cyan" /></span>}
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed", m.from === "user" ? "bg-surface-2" : "")}>
                  <p>{m.text}</p>
                  {m.reply?.pathway && (
                    <div className="mt-4 rounded-xl border bg-surface p-4">
                      <p className="eyebrow text-gold">Your suggested pathway</p>
                      <ol className="mt-3 space-y-2">
                        {m.reply.pathway.map((p, j) => (
                          <li key={p} className="flex items-center gap-3"><span className="flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px]">{j + 1}</span>{p}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {m.reply?.resources && (
                    <div className="mt-3 flex flex-wrap gap-2">{m.reply.resources.map((r) => <Tag key={r}>{r}</Tag>)}</div>
                  )}
                  {m.reply?.action && (
                    <Button asChild size="sm" className="mt-4"><Link to={m.reply.action.to}>{m.reply.action.label} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan/40 bg-cyan/10"><Bot className="h-3.5 w-3.5 text-cyan" /></span>
                <span className="flow-line h-px w-24" /> Thinking about your context…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t p-3 md:p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {AIService.suggestions[mode].map((s) => (
                <button key={s} onClick={() => send(s)} disabled={thinking} className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground disabled:opacity-50">{s}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={`${mode}: ${MODES.find((m) => m.id === mode)?.hint}…`}
                className="max-h-32 min-h-11 resize-none bg-surface"
                rows={1}
                maxLength={1000}
                aria-label="Message the AI Tutor"
              />
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!input.trim() || thinking} aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>
            </form>
          </div>
        </Panel>

        <aside className="space-y-4">
          <Panel>
            <p className="eyebrow">Learning context</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-muted-foreground">Current role</dt><dd className="mt-0.5 font-medium">{ROLES.find((r) => r.id === persona.role)?.label}</dd></div>
              <div><dt className="text-muted-foreground">Learning goal</dt><dd className="mt-0.5 font-medium">{persona.goal}</dd></div>
            </dl>
          </Panel>
          <Panel>
            <p className="eyebrow">Skills being developed</p>
            <ul className="mt-4 space-y-3">
              {developing.map((c) => <li key={c.id} className="flex items-center justify-between gap-2 text-sm"><span className="truncate">{c.name}</span><StatePill state={c.state} /></li>)}
            </ul>
          </Panel>
          <Panel>
            <p className="eyebrow">Recommended resources</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/app/learning" className="hover:text-gold">Reservation Systems in Practice →</Link></li>
              <li><Link to="/app/intelligence" className="hover:text-gold">Brief: AI concierge tools →</Link></li>
            </ul>
          </Panel>
          <Panel>
            <p className="eyebrow">Recent simulation result</p>
            {last ? (
              <div className="mt-4 text-sm">
                <p className="font-medium">{last.title}</p>
                <p className="mt-1 text-muted-foreground">{last.scores.map((s) => `${s.label.split(" ")[0]} ${s.value}`).join(" · ")}</p>
              </div>
            ) : (
              <div className="mt-4 text-sm">
                <p className="font-medium">Guest Check-in</p>
                <p className="mt-1 text-muted-foreground">Verified · strong communication, policy explanation to improve.</p>
              </div>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
