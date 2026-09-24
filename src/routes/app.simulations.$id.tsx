import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bot, Check, CircleAlert, IdCard, MessageSquare, RotateCcw, Send, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Panel, Tag } from "@/components/tw/motifs";
import { DIM_LABELS, SCENARIOS, type Decision, type Dim, type Scenario } from "@/lib/scenarios";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/simulations/$id")({
  loader: ({ params }) => {
    const s = SCENARIOS[params.id];
    if (!s) throw notFound();
    return { title: s.app };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Simulation"} — Industry Simulator` }, { name: "description", content: "A simulated tourism workplace application." }] }),
  notFoundComponent: SimNotFound,
  component: Workspace,
});

function SimNotFound() {
  return (
    <div className="py-20 text-center">
      <p className="eyebrow">Simulation unavailable</p>
      <h1 className="mt-3 text-2xl font-semibold">This simulation isn't open yet.</h1>
      <Button asChild className="mt-6"><Link to="/app/simulations">Browse simulations</Link></Button>
    </div>
  );
}

type Selections = Record<string, string | string[]>;
const DIMS: Dim[] = ["comm", "ops", "decision", "digital"];

function evaluate(s: Scenario, sel: Selections, replyId: string) {
  const raw: Record<Dim, number> = { comm: 0, ops: 0, decision: 0, digital: 0 };
  const max: Record<Dim, number> = { comm: 0, ops: 0, decision: 0, digital: 0 };
  const well: string[] = [];
  const improve: string[] = [];
  const add = (imp: Partial<Record<Dim, number>>, into: Record<Dim, number>) => DIMS.forEach((d) => (into[d] += imp[d] ?? 0));

  const groups: Decision[] = [...s.decisions, { id: "reply", title: "reply", kind: "choice", options: s.replies }];
  for (const g of groups) {
    if (g.kind === "checks") {
      const picked = (sel[g.id] as string[]) ?? [];
      g.options.forEach((o) => {
        DIMS.forEach((d) => (max[d] += Math.max(0, o.impact[d] ?? 0)));
        if (picked.includes(o.id)) { add(o.impact, raw); if (o.good) well.push(o.good); if ((Object.values(o.impact).some((v) => (v ?? 0) < 0)) && o.bad) improve.push(o.bad); }
        else if (o.bad && !Object.values(o.impact).some((v) => (v ?? 0) < 0)) improve.push(o.bad);
      });
    } else {
      DIMS.forEach((d) => (max[d] += Math.max(0, ...g.options.map((o) => o.impact[d] ?? 0))));
      const pick = g.options.find((o) => o.id === (g.id === "reply" ? replyId : sel[g.id]));
      if (pick) { add(pick.impact, raw); if (pick.good) well.push(pick.good); if (pick.bad) improve.push(pick.bad); }
    }
  }
  const scores = DIMS.map((d) => ({ label: DIM_LABELS[d], value: Math.max(12, Math.min(100, Math.round((raw[d] / (max[d] || 1)) * 100))) }));
  return { scores, well, improve };
}

function Workspace() {
  const { id } = Route.useParams();
  const scenario = SCENARIOS[id];
  const { recordAttempt, addAttemptToPassport, attempts } = useApp();
  const [sel, setSel] = useState<Selections>({});
  const [replyId, setReplyId] = useState<string>("");
  const [replyText, setReplyText] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [result, setResult] = useState<{ attemptId: string; scores: { label: string; value: number }[]; well: string[]; improve: string[] } | null>(null);

  const required = scenario.decisions.filter((d) => d.kind !== "checks").map((d) => d.id);
  const missing = [...required.filter((r) => !sel[r]), ...(replyId ? [] : ["reply"])];
  const attempt = useMemo(() => attempts.find((a) => a.id === result?.attemptId), [attempts, result]);

  const submit = () => {
    if (missing.length) { setShowErrors(true); return; }
    const r = evaluate(scenario, sel, replyId);
    const attemptId = recordAttempt({ simId: scenario.id, title: scenario.app, scores: r.scores, competencies: scenario.competencies });
    setResult({ attemptId, ...r });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => { setSel({}); setReplyId(""); setReplyText(""); setShowErrors(false); setResult(null); };

  if (result) return <Review scenario={scenario} result={result} added={!!attempt?.addedToPassport} onAdd={() => addAttemptToPassport(result.attemptId)} onRetry={reset} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground"><Link to="/app/simulations"><ArrowLeft className="mr-1 h-4 w-4" /> Simulator</Link></Button>
        <Tag tone="cyan">Live simulation · decisions are assessed</Tag>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-surface px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /></span>
            <span className="font-display text-sm font-semibold uppercase tracking-wider">{scenario.app}</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">Zambezi Grand Hotel · PMS v8.2 · Shift: Evening</span>
        </div>

        <div className="border-b bg-gold/5 px-5 py-4">
          <p className="eyebrow text-gold">Scenario</p>
          <p className="mt-1 max-w-4xl">{scenario.brief}</p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr_340px]">
          {/* Guest + policies */}
          <div className="space-y-6 border-b p-5 lg:border-b-0 lg:border-r">
            <div>
              <p className="eyebrow flex items-center gap-1.5"><UserRound className="h-3 w-3" /> Guest details</p>
              <p className="mt-3 font-medium">{scenario.guest.name}</p>
              <dl className="mt-3 space-y-2 text-sm">
                {scenario.guest.detail.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </div>
            <div>
              <p className="eyebrow flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Policies</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {scenario.policies.map((p) => <li key={p} className="border-l-2 border-border pl-3">{p}</li>)}
              </ul>
            </div>
          </div>

          {/* System */}
          <div className="space-y-6 border-b p-5 lg:border-b-0 lg:border-r">
            {scenario.decisions.map((d) => (
              <fieldset key={d.id}>
                <legend className="eyebrow mb-3 flex items-center gap-2">
                  {d.title}
                  {showErrors && missing.includes(d.id) && <span className="flex items-center gap-1 normal-case tracking-normal text-destructive"><CircleAlert className="h-3 w-3" /> Required</span>}
                </legend>
                {d.kind === "table" && (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[420px] text-sm">
                      <thead className="bg-surface text-left text-xs text-muted-foreground">
                        <tr><th className="w-10 px-3 py-2" />{d.columns?.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {d.options.map((o) => (
                          <tr key={o.id} onClick={() => !o.disabled && setSel({ ...sel, [d.id]: o.id })} className={cn("border-t transition-colors", o.disabled ? "text-muted-foreground/60" : "cursor-pointer hover:bg-accent", sel[d.id] === o.id && "bg-gold/10")}>
                            <td className="px-3 py-2.5"><span className={cn("block h-4 w-4 rounded-full border", sel[d.id] === o.id && "border-gold bg-gold")} /></td>
                            <td className="px-3 py-2.5">{o.label}</td>
                            {o.meta?.map((m, i) => <td key={i} className={cn("px-3 py-2.5 font-mono", i === 0 && m === "0" && "text-destructive/70")}>{i === 0 && m === "0" ? "Sold out" : m}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {d.kind === "choice" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {d.options.map((o) => (
                      <button key={o.id} type="button" onClick={() => setSel({ ...sel, [d.id]: o.id })} className={cn("rounded-xl border p-3 text-left text-sm transition-colors hover:border-foreground/20", sel[d.id] === o.id && "border-gold/60 bg-gold/10")}>
                        <span className="font-medium">{o.label}</span>
                        {o.detail && <span className="mt-1 block text-xs text-muted-foreground">{o.detail}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {d.kind === "checks" && (
                  <div className="space-y-2">
                    {d.options.map((o) => {
                      const cur = (sel[d.id] as string[]) ?? [];
                      const on = cur.includes(o.id);
                      return (
                        <label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors hover:border-foreground/20", on && "border-cyan/40 bg-cyan/5")}>
                          <Checkbox checked={on} onCheckedChange={(v) => setSel({ ...sel, [d.id]: v ? [...cur, o.id] : cur.filter((x) => x !== o.id) })} />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            ))}
          </div>

          {/* Communication */}
          <div className="flex flex-col p-5">
            <p className="eyebrow flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Guest communication</p>
            <div className="mt-3 rounded-2xl rounded-tl-sm bg-surface-2 p-3 text-sm">{scenario.inbound}</div>
            <p className="mt-5 text-xs text-muted-foreground">Choose a reply approach, then refine it.
              {showErrors && missing.includes("reply") && <span className="ml-1 text-destructive">Required</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {scenario.replies.map((r) => (
                <button key={r.id} type="button" onClick={() => { setReplyId(r.id); setReplyText(r.detail?.replace(/^"|"$/g, "") ?? ""); }} className={cn("rounded-full border px-3 py-1 text-xs transition-colors", replyId === r.id ? "border-gold/60 bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground")}>{r.label}</button>
              ))}
            </div>
            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Your reply to the guest…" className="mt-3 min-h-40 flex-1 bg-surface text-sm" maxLength={800} aria-label="Reply to guest" />
            <Button className="mt-4" size="lg" onClick={submit}><Send className="mr-1 h-4 w-4" /> Submit decisions</Button>
            {showErrors && missing.length > 0 && <p className="mt-2 text-xs text-destructive">Complete the required sections before submitting.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Review({ scenario, result, added, onAdd, onRetry }: { scenario: Scenario; result: { scores: { label: string; value: number }[]; well: string[]; improve: string[] }; added: boolean; onAdd: () => void; onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground"><Link to="/app/simulations"><ArrowLeft className="mr-1 h-4 w-4" /> Simulator</Link></Button>
        <Button variant="outline" size="sm" onClick={onRetry}><RotateCcw className="mr-1 h-3.5 w-3.5" /> Try again</Button>
      </div>
      <div className="fade-up">
        <p className="eyebrow flex items-center gap-2 text-cyan"><Bot className="h-3.5 w-3.5" /> AI performance review</p>
        <h1 className="mt-2 text-3xl font-semibold">{scenario.app}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel>
          <p className="eyebrow">Performance profile</p>
          <div className="mt-6 space-y-5">
            {result.scores.map((s, i) => (
              <div key={s.label} className="fade-up" style={{ animationDelay: `${i * 120}ms` }}>
                <div className="mb-2 flex justify-between text-sm"><span>{s.label}</span><span className="font-mono text-xs text-muted-foreground">{s.value >= 80 ? "Strong" : s.value >= 60 ? "Solid" : "Developing"}</span></div>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <span key={j} className={cn("h-2.5 flex-1 rounded-sm", j < Math.round(s.value / 10) ? (s.value >= 70 ? "bg-gold" : "bg-cyan") : "bg-muted")} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="eyebrow mt-8">Competencies demonstrated</p>
          <div className="mt-3 flex flex-wrap gap-2">{scenario.competencies.map((c) => <Tag key={c} tone="gold">{c}</Tag>)}</div>
          <div className="mt-8 rounded-xl border border-gold/30 bg-gold/5 p-4">
            {added ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-gold" /> Added to your Tourism Skills Passport.</p>
                <Button asChild size="sm" variant="outline"><Link to="/app/passport">View Skills Passport</Link></Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">Turn this evidence into verified capability.</p>
                <Button onClick={onAdd}><IdCard className="mr-1 h-4 w-4" /> Add to Skills Passport</Button>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="fade-up" >
            <p className="eyebrow text-gold">What you handled well</p>
            <ul className="mt-3 space-y-2 text-sm">{(result.well.length ? result.well : ["You completed the scenario under realistic constraints."]).map((w) => <li key={w} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{w}</li>)}</ul>
          </Panel>
          <Panel className="fade-up [animation-delay:150ms]">
            <p className="eyebrow text-cyan">What could improve</p>
            <ul className="mt-3 space-y-2 text-sm">{(result.improve.length ? result.improve : ["Excellent — no significant gaps. Try a harder scenario next."]).map((w) => <li key={w} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />{w}</li>)}</ul>
          </Panel>
          <Panel className="fade-up [animation-delay:300ms]">
            <p className="eyebrow">Industry reasoning</p>
            <p className="mt-3 text-sm text-muted-foreground">{scenario.reasoning}</p>
          </Panel>
          <Panel className="fade-up border-gold/25 [animation-delay:450ms]">
            <p className="eyebrow">Your next challenge</p>
            <p className="mt-2 font-display text-lg font-semibold">"{scenario.next.title}"</p>
            <Button asChild className="mt-4" onClick={onRetry}><Link to="/app/simulations/$id" params={{ id: scenario.next.id }}>Start Simulation <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
