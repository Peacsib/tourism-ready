import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Meter, PageHeader, Panel, Tag } from "@/components/tw/motifs";
import { COURSES, LEARNING_CATEGORIES } from "@/lib/data";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/learning")({
  head: () => ({ meta: [{ title: "Learning Hub — Tourism Workforce 2031" }, { name: "description", content: "Structured tourism & hospitality learning connected to practice." }] }),
  component: Learning,
});

function Learning() {
  const { courseProgress, advanceCourse } = useApp();
  const [cat, setCat] = useState("All");
  const list = COURSES.filter((c) => cat === "All" || c.category === cat);
  const prog = (id: string, base: number) => courseProgress[id] ?? base;
  const current = COURSES[0]!;
  const cp = prog(current.id, current.progress);

  const cont = (id: string, base: number, title: string, modules: number) => {
    const before = prog(id, base);
    advanceCourse(id, base);
    const done = Math.min(modules, Math.round(((Math.min(100, before + (before === 0 ? 17 : 16))) / 100) * modules));
    toast.success(before >= 100 ? "Course already complete" : `Module ${done} of ${modules} completed`, { description: title });
  };

  return (
    <div>
      <PageHeader eyebrow="Learn" title="Learning Hub" subtitle="Structured pathways where every module connects to a skill, a simulation and your Passport." />

      <Panel className="mb-8 border-gold/25">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="eyebrow text-gold">Continue learning</p>
            <h2 className="mt-2 text-2xl font-semibold">{current.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{current.modules} modules · Skills developed: {current.skills.join(", ")}</p>
            <div className="mt-4 max-w-md"><Meter value={cp} /></div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">{cp}% complete</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => cont(current.id, current.progress, current.title, current.modules)} disabled={cp >= 100}>{cp >= 100 ? "Completed" : "Continue"}</Button>
            <Button size="lg" variant="outline" asChild><Link to="/app/tutor"><Bot className="mr-1 h-4 w-4" /> Ask AI Tutor</Link></Button>
          </div>
        </div>
      </Panel>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {["All", ...LEARNING_CATEGORIES].map((c) => <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors", cat === c ? "border-gold/50 bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground")}>{c}</button>)}
      </div>

      {list.length === 0 ? (
        <Panel className="py-10 text-center text-sm text-muted-foreground">New {cat} pathways are being prepared with industry partners.</Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const p = prog(c.id, c.progress);
            return (
              <div key={c.id} className="lift flex flex-col rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between"><Tag>{c.category}</Tag><span className="flex items-center gap-1 font-mono text-xs text-muted-foreground"><Clock className="h-3 w-3" />{c.duration}</span></div>
                <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.modules} modules · {c.difficulty}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">{c.skills.map((s) => <Tag key={s} tone="cyan">{s}</Tag>)}</div>
                <p className="mt-3 flex-1 text-xs text-muted-foreground"><span className="text-gold">Industry relevance · </span>{c.relevance}</p>
                <div className="mt-4"><Meter value={p} /><p className="mt-1.5 font-mono text-xs text-muted-foreground">{p}%</p></div>
                <Button className="mt-4" size="sm" variant={p > 0 ? "default" : "outline"} disabled={p >= 100} onClick={() => cont(c.id, c.progress, c.title, c.modules)}>
                  {p >= 100 ? <><Check className="mr-1 h-3.5 w-3.5" /> Completed</> : p > 0 ? "Continue" : "Start"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
