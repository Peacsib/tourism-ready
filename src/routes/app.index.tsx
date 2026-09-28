import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Bot, BrainCircuit, Compass, Network, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Meter, Panel, ReadinessPath, Signal, StatePill } from "@/components/tw/motifs";
import { ARTICLES, COURSES, TRENDS, type RoleId } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Overview — Tourism Workforce 2031" }, { name: "description", content: "Your workforce readiness snapshot and next step." }] }),
  component: Overview,
});

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

const RECOMMEND: Record<RoleId, { title: string; why: string; cta: string; to: string }> = {
  student: { title: "Handle a high-volume hotel reservation scenario.", why: "Reservation Management is your closest skill to Demonstrated, and it is central to the placements you match.", cta: "Start simulation", to: "/app/simulations/reservation-desk" },
  professional: { title: "Recover an overbooked guest without losing the relationship.", why: "Service recovery and revenue awareness are the next capabilities to strengthen for supervisor roles.", cta: "Practise the scenario", to: "/app/simulations/overbooking" },
  employer: { title: "Review reservation-ready candidates with verified evidence.", why: "Your next hire should be judged on demonstrated capability, not only a certificate or CV.", cta: "Find candidates", to: "/app/network" },
  educator: { title: "Assign a practical reservation challenge to your cohort.", why: "The fastest way to expose the readiness gap is to let learners practise the work in context.", cta: "Preview simulation", to: "/app/simulations/reservation-desk" },
  entrepreneur: { title: "Launch direct online booking for your tourism business.", why: "Digital distribution and customer experience are the highest-leverage skills for your next stage of growth.", cta: "Build the capability", to: "/app/tutor" },
};

const PILLARS = [
  { number: "01", title: "AI Smart Tutor", body: "Build the knowledge and judgement behind great tourism work.", detail: "Learn · Review · Prepare", to: "/app/tutor", icon: BrainCircuit, tone: "cyan" },
  { number: "02", title: "Industry Simulator", body: "Practise the moments that determine whether guests come back.", detail: "Role-play · Score · Improve", to: "/app/simulations", icon: Workflow, tone: "gold" },
  { number: "03", title: "Industry Intelligence", body: "Understand the technologies, trends and opportunities reshaping the sector.", detail: "Signals · Research · Field", to: "/app/intelligence", icon: BarChart3, tone: "cyan" },
  { number: "04", title: "Professional Network", body: "Turn demonstrated capability into mentors, employers and opportunity.", detail: "People · Roles · Visibility", to: "/app/network", icon: Network, tone: "gold" },
] as const;

function Overview() {
  const { persona, competencies, attempts, connections, courseProgress } = useApp();
  const rec = RECOMMEND[persona.role];
  const demonstrated = competencies.filter((c) => c.state === "Demonstrated" || c.state === "Verified").length;
  const readinessScore = Math.round(competencies.reduce((total, competency) => total + competency.level, 0) / competencies.length);
  const learningProgress = Math.round(COURSES.reduce((total, course) => total + (courseProgress[course.id] ?? course.progress), 0) / COURSES.length);

  return (
    <div className="space-y-8">
      <section className="fade-up grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div>
          <p className="eyebrow">Tourism Workforce 2031 · Workforce readiness engine</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight md:text-6xl">
            {greeting()}, {persona.firstName}.<br /><span className="text-gradient">Build proof employers can trust.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Turn tourism knowledge into workplace capability through guided learning, realistic practice and evidence you can take to an employer.</p>
        </div>
        <div className="lg:justify-self-end lg:text-right">
          <p className="eyebrow">Your current readiness</p>
          <p className="mt-1 font-display text-6xl font-semibold text-gold">{readinessScore}<span className="text-2xl text-muted-foreground">/100</span></p>
          <p className="mt-1 text-sm text-muted-foreground">{demonstrated} competencies demonstrated or verified</p>
        </div>
      </section>

      <Panel className="relative overflow-hidden border-cyan/20">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-cyan"><Compass className="h-4 w-4" /><p className="eyebrow text-cyan">The readiness pathway</p></div>
            <h2 className="mt-4 text-2xl font-semibold">From classroom confidence to workplace proof.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Every activity should move you closer to being trusted with real guests, real systems and real decisions.</p>
            <span className="mt-5 inline-flex max-w-full rounded-md border border-cyan/30 bg-cyan/10 px-2 py-1 font-mono text-[11px] text-cyan">Current focus · {persona.goal || "Build job-ready tourism capability"}</span>
          </div>
          <div className="rounded-2xl border bg-background/50 p-5 md:p-7">
            <ReadinessPath active={attempts.some((attempt) => attempt.addedToPassport) ? 3 : 2} progress={0.4} />
            <div className="mt-7 grid grid-cols-3 gap-4 border-t pt-5 text-sm">
              <div><p className="font-display text-2xl font-semibold">{attempts.length + 3}</p><p className="mt-1 text-muted-foreground">practice attempts</p></div>
              <div><p className="font-display text-2xl font-semibold">{learningProgress}%</p><p className="mt-1 text-muted-foreground">learning progress</p></div>
              <div><p className="font-display text-2xl font-semibold">{connections.length + 38}</p><p className="mt-1 text-muted-foreground">professional links</p></div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Choose your next move</p><h2 className="mt-2 text-2xl font-semibold md:text-3xl">Become ready for the work.</h2></div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">Each path builds the same outcome: practical capability with evidence behind it.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {PILLARS.map((pillar) => (
          <Link key={pillar.title} to={pillar.to} className="group rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:border-foreground/25 hover:shadow-lg md:p-7">
            <div className="flex items-start justify-between"><span className={pillar.tone === "gold" ? "flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-gold" : "flex h-11 w-11 items-center justify-center rounded-xl bg-cyan/12 text-cyan"}><pillar.icon className="h-5 w-5" /></span><span className="font-mono text-xs text-muted-foreground">{pillar.number}</span></div>
            <h3 className="mt-7 text-xl font-semibold group-hover:text-gold">{pillar.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{pillar.body}</p>
            <div className="mt-7 flex items-center justify-between border-t pt-4 text-xs"><span className="font-mono uppercase tracking-wider text-muted-foreground">{pillar.detail}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
          </Link>
        ))}
      </div>

      <Panel className="border-gold/25">
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><div className="flex items-center gap-2 text-gold"><Sparkles className="h-4 w-4" /><p className="eyebrow text-gold">Your next best move</p></div><h2 className="mt-3 text-2xl font-semibold">{rec.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{rec.why}</p></div>
          <div className="flex flex-wrap gap-3 lg:justify-end"><Button asChild size="lg"><Link to={rec.to}>{rec.cta} <ArrowRight className="ml-1 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline"><Link to="/app/tutor"><Bot className="mr-1 h-4 w-4" /> Ask the tutor</Link></Button></div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel><div className="flex items-center justify-between"><p className="eyebrow">Skills in motion</p><Link to="/app/tutor" className="text-xs text-muted-foreground hover:text-foreground">Improve a skill →</Link></div><ul className="mt-5 space-y-4">{[...competencies].sort((a, b) => b.level - a.level).slice(2, 6).map((competency) => <li key={competency.id}><div className="mb-1.5 flex items-center justify-between gap-2 text-sm"><span className="truncate">{competency.name}</span><StatePill state={competency.state} /></div><Meter value={competency.level} tone={competency.state === "Practising" || competency.state === "Developing" ? "cyan" : "gold"} /></li>)}</ul></Panel>
        <Panel><div className="flex items-center justify-between"><p className="eyebrow">Industry signals</p><Link to="/app/intelligence" className="text-xs text-muted-foreground hover:text-foreground">Explore →</Link></div><ul className="mt-5 space-y-4">{TRENDS.slice(0, 3).map((trend) => <li key={trend.id} className="flex items-center justify-between gap-3"><span className="text-sm">{trend.name}</span><span className="flex items-center gap-3"><Signal value={trend.momentum} /><span className="w-10 text-right font-mono text-xs text-cyan">{trend.change}</span></span></li>)}</ul><Link to="/app/intelligence" className="mt-6 block rounded-xl border bg-surface-2/50 p-4 transition-colors hover:border-foreground/20"><p className="eyebrow">Latest brief</p><p className="mt-2 text-sm font-medium">{ARTICLES[0]!.title}</p></Link></Panel>
        <Panel><p className="eyebrow">What this proves</p><h3 className="mt-4 text-xl font-semibold">Capability is more than a certificate.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Your progress combines learning, scenario performance, reflection and professional evidence into a story employers can understand.</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border bg-surface-2/50 p-3"><p className="font-display text-2xl font-semibold">{demonstrated}</p><p className="text-xs text-muted-foreground">skills with evidence</p></div><div className="rounded-xl border bg-surface-2/50 p-3"><p className="font-display text-2xl font-semibold">{attempts.length + 3}</p><p className="text-xs text-muted-foreground">practice sessions</p></div></div></Panel>
      </div>
    </div>
  );
}
