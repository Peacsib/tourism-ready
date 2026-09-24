import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Building2, Clock, Cpu, Lock, Plane, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Tag } from "@/components/tw/motifs";
import { SIMULATIONS, type SimCategory } from "@/lib/data";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/simulations/")({
  head: () => ({ meta: [{ title: "Industry Simulator — Tourism Workforce 2031" }, { name: "description", content: "Practise the workplace before you enter it." }] }),
  component: Simulations,
});

const CATS: { id: SimCategory; icon: typeof Building2 }[] = [
  { id: "Hotel Operations", icon: Building2 },
  { id: "Travel Operations", icon: Plane },
  { id: "Digital Tourism", icon: Cpu },
  { id: "Management", icon: Users },
];

function Simulations() {
  const [cat, setCat] = useState<SimCategory | "All">("All");
  const { attempts } = useApp();
  const list = SIMULATIONS.filter((s) => cat === "All" || s.category === cat);
  const featured = SIMULATIONS[0];

  return (
    <div>
      <PageHeader eyebrow="Practise" title="Industry Simulator" subtitle="Practise the workplace before you enter it. Realistic operational systems, real decisions, industry-reasoned feedback." />

      <Link to="/app/simulations/$id" params={{ id: featured.id }} className="lift group relative mb-8 block overflow-hidden rounded-3xl border bg-card p-6 md:p-8">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow text-gold">Recommended by your AI Tutor</p>
            <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{featured.title}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{featured.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">{featured.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>
          </div>
          <span className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">Start Simulation <ArrowRight className="ml-1 h-4 w-4" /></span>
        </div>
      </Link>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {(["All", ...CATS.map((c) => c.id)] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors", cat === c ? "border-gold/50 bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground")}>{c}</button>
        ))}
      </div>

      <div className="space-y-10">
        {CATS.filter((c) => cat === "All" || c.id === cat).map((c) => (
          <section key={c.id}>
            <div className="mb-4 flex items-center gap-2"><c.icon className="h-4 w-4 text-cyan" strokeWidth={1.6} /><h2 className="font-display text-sm font-semibold uppercase tracking-wider">{c.id}</h2></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.filter((s) => s.category === c.id).map((s) => {
                const done = attempts.some((a) => a.simId === s.id);
                return (
                  <div key={s.id} className={cn("flex flex-col rounded-2xl border bg-card p-5", s.available && "lift")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {s.duration} · {s.difficulty}</span>
                      {done ? <Tag tone="gold">Completed</Tag> : !s.available && <Tag>Coming soon</Tag>}
                    </div>
                    <h3 className="mt-4 font-display font-semibold">{s.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.summary}</p>
                    <div className="mt-4">
                      {s.available ? (
                        <Button asChild size="sm" variant={done ? "outline" : "default"}><Link to="/app/simulations/$id" params={{ id: s.id }}>{done ? "Practise again" : "Start Simulation"}</Link></Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => toast.success("We'll notify you when this simulation opens.", { description: s.title })}><Lock className="mr-1 h-3 w-3" /> Notify me</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
