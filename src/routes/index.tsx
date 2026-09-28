import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Bot, Check, Network, ShieldCheck, Workflow } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/tw/motifs";
import { cn } from "@/lib/utils";
import heroVideo from "@/assets/hero-live.mp4";
import imgTutor from "@/assets/pillar-tutor.jpg";
import imgSim from "@/assets/pillar-sim.jpg";
import imgIntel from "@/assets/pillar-intel.jpg";
import imgNet from "@/assets/pillar-network.jpg";
import passportImg from "@/assets/passport-confidential.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tourism Workforce 2031 — Build proof employers can trust" },
      { name: "description", content: "A workforce-readiness platform helping Zimbabwe's tourism and hospitality professionals learn, practise, prove capability and connect to opportunity." },
      { property: "og:site_name", content: "Tourism Workforce 2031" },
      { property: "og:title", content: "Tourism Workforce 2031 — Build proof employers can trust" },
      { property: "og:description", content: "Turn tourism knowledge into workplace capability through guided learning, realistic practice and evidence employers can understand." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://tourism-ready.vercel.app/" },
      { property: "og:image", content: "https://tourism-ready.vercel.app/og-image.jpg" },
      { property: "og:image:alt", content: "Tourism Workforce 2031" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tourism Workforce 2031 — Build proof employers can trust" },
      { name: "twitter:description", content: "Learn. Practise. Prove. Connect." },
      { name: "twitter:image", content: "https://tourism-ready.vercel.app/og-image.jpg" },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  { number: "01", icon: Bot, image: imgTutor, title: "AI Smart Tutor", body: "Build the knowledge and judgement behind great tourism work.", tags: "Learn · Review · Prepare", tone: "cyan" },
  { number: "02", icon: Workflow, image: imgSim, title: "Industry Simulator", body: "Practise real decisions before real guests are waiting.", tags: "Role-play · Score · Improve", tone: "gold" },
  { number: "03", icon: BarChart3, image: imgIntel, title: "Industry Intelligence", body: "See the technologies, trends and skills reshaping the sector.", tags: "Signals · Research · Field", tone: "cyan" },
  { number: "04", icon: Network, image: imgNet, title: "Professional Network", body: "Turn demonstrated capability into mentors and opportunity.", tags: "People · Roles · Visibility", tone: "gold" },
] as const;

const STAGES = [
  { label: "Learn", title: "Build the right foundation", body: "Short, practical guidance grounded in tourism operations, technology and guest experience." },
  { label: "Practise", title: "Rehearse the real work", body: "Handle the reservation conflict, service recovery or digital decision before it happens on shift." },
  { label: "Prove", title: "Turn performance into evidence", body: "Get industry-reasoned feedback and build a record of what you can actually do." },
  { label: "Connect", title: "Be visible to the right people", body: "Share a clearer professional story with peers, mentors, educators and employers." },
  { label: "Discover", title: "Keep moving with the sector", body: "Follow the trends, opportunities and capabilities that will shape tourism next." },
];

function Landing() {
  const [stage, setStage] = useState(0);
  const selected = STAGES[stage]!;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-5">
            <a href="#solution" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline">The solution</a>
            <a href="#proof" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline">The proof</a>
            <Button asChild size="sm" className="rounded-xl px-4"><Link to="/start">Enter platform <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b">
          <video className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-[center_35%]" autoPlay muted loop playsInline aria-hidden="true"><source src={heroVideo} type="video/mp4" /></video>
          <div className="absolute inset-0 -z-10 bg-background/80" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/45" />
          <div className="hero-glow pointer-events-none absolute inset-0 -z-10 opacity-40" />
          <div className="mx-auto grid min-h-[calc(100svh-73px)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <p className="eyebrow text-cyan">Zimbabwe · Tourism workforce readiness</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-.045em] sm:text-6xl lg:text-8xl">Tourism knowledge is not enough.<br /><span className="text-gradient">Prove you can do the work.</span></h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Tourism Workforce 2031 closes the gap between classroom theory and workplace confidence through guided learning, realistic practice and evidence employers can understand.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 rounded-xl px-6"><Link to="/start">Build your readiness <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 bg-background/50"><a href="#solution">See how it works</a></Button></div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan" /> Built for Zimbabwe’s tourism sector</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gold" /> Designed around job-ready capability</span></div>
            </div>
            <div className="lg:justify-self-end">
              <div className="rounded-3xl border border-foreground/10 bg-background/75 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="flex items-start justify-between gap-6"><div><p className="eyebrow text-cyan">The readiness system</p><h2 className="mt-3 text-2xl font-semibold">From learning<br />to workplace proof.</h2></div><ShieldCheck className="h-7 w-7 text-gold" strokeWidth={1.5} /></div>
                <div className="mt-8 space-y-1">{["Learn the context", "Practise the decision", "Prove the capability", "Connect to opportunity"].map((item, index) => <div key={item} className="flex items-center gap-3 border-b py-3 last:border-0"><span className={cn("flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs", index < 2 ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground")}>{index + 1}</span><span className={cn("text-sm", index >= 2 && "text-muted-foreground")}>{item}</span>{index < 2 && <span className="ml-auto text-[10px] font-mono uppercase text-gold">active</span>}</div>)}</div>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-5"><div><p className="font-display text-2xl font-semibold">4</p><p className="mt-1 text-[11px] text-muted-foreground">core pillars</p></div><div><p className="font-display text-2xl font-semibold">2031</p><p className="mt-1 text-[11px] text-muted-foreground">future-ready</p></div><div><p className="font-display text-2xl font-semibold">1</p><p className="mt-1 text-[11px] text-muted-foreground">clear pathway</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b" id="solution">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-end"><div><p className="eyebrow">The problem worth solving</p><h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Certificates show attendance. Employers need confidence.</h2></div><p className="max-w-2xl text-base leading-7 text-muted-foreground">Tourism is becoming more digital, more operationally complex and more guest-centred. Learners need a safe place to practise the systems, decisions and judgement that work demands.</p></div>
            <div className="mt-12 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border bg-card p-6"><p className="font-mono text-sm text-cyan">01 · KNOWLEDGE GAP</p><h3 className="mt-8 text-xl font-semibold">Theory without context</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Understand why the work matters, not only what the textbook calls it.</p></div><div className="rounded-2xl border bg-card p-6"><p className="font-mono text-sm text-gold">02 · PRACTICE GAP</p><h3 className="mt-8 text-xl font-semibold">No safe place to rehearse</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Make decisions with realistic guests, systems and constraints before the shift begins.</p></div><div className="rounded-2xl border bg-card p-6"><p className="font-mono text-sm text-cyan">03 · TRUST GAP</p><h3 className="mt-8 text-xl font-semibold">Capability is hard to see</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Create evidence that helps employers recognise readiness beyond a CV.</p></div></div>
          </div>
        </section>

        <section className="border-b bg-surface/40" id="pillars">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">The solution</p><h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Four tools. One outcome.</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">Everything is designed to move a learner from knowing about tourism to being trusted with it.</p></div><div className="mt-12 grid gap-4 md:grid-cols-2">{PILLARS.map((pillar) => <article key={pillar.title} className="group overflow-hidden rounded-3xl border bg-card"><div className="overflow-hidden"><img src={pillar.image} alt={pillar.title} width={1024} height={640} loading="lazy" className="aspect-[16/8] w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div><div className="p-6 sm:p-8"><div className="flex items-center justify-between"><span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", pillar.tone === "gold" ? "bg-gold/12 text-gold" : "bg-cyan/12 text-cyan")}><pillar.icon className="h-5 w-5" /></span><span className="font-mono text-xs text-muted-foreground">{pillar.number}</span></div><h3 className="mt-7 text-2xl font-semibold">{pillar.title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{pillar.body}</p><p className="mt-7 border-t pt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">{pillar.tags}</p></div></article>)}</div></div>
        </section>

        <section className="border-b" id="proof">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="eyebrow">The proof</p><h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">A Skills Passport built on evidence.</h2><p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Your professional identity should show what you can do, how you developed it and where you are ready to contribute.</p><ul className="mt-8 space-y-3 text-sm">{["Simulation-backed competencies", "Learning and reflection history", "Industry badges and milestones", "A profile employers can understand"].map((item) => <li key={item} className="flex items-center gap-3"><Check className="h-4 w-4 text-gold" />{item}</li>)}</ul></div><div className="relative overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-lift)]"><div className="absolute inset-0 bg-gradient-to-tr from-cyan/10 via-transparent to-gold/10" /><img src={passportImg} alt="Tourism Skills Passport showing verified capability" width={1024} height={1024} loading="lazy" className="relative h-full max-h-[560px] w-full object-cover" /></div></div></div>
        </section>

        <section className="border-b bg-surface/40">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><p className="eyebrow">The readiness loop</p><h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Progress you can explain.</h2><p className="mt-5 text-base leading-7 text-muted-foreground">Each stage creates a useful next step. No dead-end content. No meaningless points.</p><div className="mt-8 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible">{STAGES.map((item, index) => <button key={item.label} onClick={() => setStage(index)} className={cn("flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors lg:w-full", stage === index ? "border-gold/40 bg-gold/10 text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground")}><span className={cn("flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs", stage === index && "border-gold text-gold")}>{index + 1}</span>{item.label}</button>)}</div></div><div className="rounded-3xl border bg-card p-6 sm:p-10"><p className="eyebrow text-gold">Stage {stage + 1} · {selected.label}</p><h3 className="mt-5 text-3xl font-semibold sm:text-4xl">{selected.title}</h3><p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{selected.body}</p><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-surface-2/60 p-4"><p className="font-mono text-xs text-cyan">INPUT</p><p className="mt-3 text-sm">Knowledge, goals and context</p></div><div className="rounded-2xl border bg-surface-2/60 p-4"><p className="font-mono text-xs text-gold">ACTION</p><p className="mt-3 text-sm">A real tourism decision</p></div><div className="rounded-2xl border bg-surface-2/60 p-4"><p className="font-mono text-xs text-cyan">OUTPUT</p><p className="mt-3 text-sm">Evidence and next step</p></div></div><div className="mt-10 flex gap-2"><Button variant="outline" size="sm" disabled={stage === 0} onClick={() => setStage((value) => value - 1)}>Previous</Button>{stage < STAGES.length - 1 ? <Button size="sm" onClick={() => setStage((value) => value + 1)}>Next stage <ArrowRight className="ml-1 h-4 w-4" /></Button> : <Button asChild size="sm"><Link to="/start">Start your journey <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>}</div></div></div></div>
        </section>

        <section><div className="mx-auto max-w-4xl px-5 py-24 text-center lg:py-36"><p className="eyebrow text-cyan">Ready when you are</p><h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Build a tourism career people can trust.</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Start with your role, your goals and the capability you want to prove next.</p><Button asChild size="lg" className="mt-9 h-12 rounded-xl px-7"><Link to="/start">Enter Tourism Workforce 2031 <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button></div></section>
      </main>

      <footer className="border-t"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center lg:px-8"><Logo /><p>A workforce-readiness initiative for Zimbabwe’s tourism and hospitality sector.</p></div></footer>
    </div>
  );
}
