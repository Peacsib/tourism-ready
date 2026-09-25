import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BookOpen, Bot, Check, Network, Radar, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, Signal, Tag } from "@/components/tw/motifs";
import { TRENDS } from "@/lib/data";
import { cn } from "@/lib/utils";
import passportImg from "@/assets/passport-confidential.jpg";
import heroVideo from "@/assets/hero-live.mp4.asset.json";
import imgTutor from "@/assets/pillar-tutor.jpg";
import imgSim from "@/assets/pillar-sim.jpg";
import imgIntel from "@/assets/pillar-intel.jpg";
import imgNet from "@/assets/pillar-network.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tourism Workforce 2031 — The future of tourism workforce readiness" },
      { name: "description", content: "An AI-powered ecosystem where Zimbabwe's tourism and hospitality workforce learns, practises real industry scenarios, proves skills and connects with industry." },
      { property: "og:title", content: "Tourism Workforce 2031" },
      { property: "og:description", content: "From classroom knowledge to real-world capability. Learn, practise, prove, connect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  { icon: Bot, img: imgTutor, title: "AI Smart Tutor", body: "Personalised learning assistance and feedback that knows your role, your goals and your gaps.", tone: "text-cyan" },
  { icon: Workflow, img: imgSim, title: "Industry Simulator", body: "Practise realistic tourism and hospitality operations — reservation desks, ticketing, service recovery.", tone: "text-gold" },
  { icon: Radar, img: imgIntel, title: "Industry Intelligence", body: "Stay informed about the trends, research, technologies and industry changes shaping your work.", tone: "text-cyan" },
  { icon: Network, img: imgNet, title: "Professional Network", body: "Connect learners, educators, employers and practitioners across Zimbabwe's tourism sector.", tone: "text-gold" },
];

const STAGES = [
  { name: "Knowledge", example: "Learn hotel operations.", detail: "Structured modules and an AI tutor explain front-office operations, reservation logic and guest communication.", visual: ["Hotel Operations Fundamentals", "Module 5 · Cancellation policies", "AI Tutor: 'Why do flexible rates cost more?'"] },
  { name: "Practice", example: "Handle a simulated reservation request.", detail: "A realistic reservation workspace: guest profile, live room availability, policies and a guest message thread.", visual: ["Guest profile · 3-night stay", "Standard rooms: sold out", "Premium King · available · flexible"] },
  { name: "Feedback", example: "AI identifies strengths and gaps.", detail: "Instead of a score, you receive an industry-reasoned performance profile with specific next steps.", visual: ["Customer communication · strong", "Policy explanation · improve", "Next: confirm terms before options"] },
  { name: "Competency", example: "Skill added to your Tourism Skills Passport.", detail: "Demonstrated skills become verifiable entries on a living professional identity employers can trust.", visual: ["Reservation Management → Demonstrated", "Evidence: linked simulation attempt", "Visible to connected employers"] },
  { name: "Opportunity", example: "Discover relevant career or industry opportunities.", detail: "Your verified capability is matched to internships, placements, mentors and roles across Zimbabwe.", visual: ["Internships matched to your passport", "Mentors from the member network", "Roles posted by verified employers"] },
];

function Landing() {
  const [stage, setStage] = useState(0);
  const s = STAGES[stage]!;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-2">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline">How it works</a>
          <Button asChild size="sm" variant="outline">
            <Link to="/start">Enter platform</Link>
          </Button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative">
        <video className="pointer-events-none absolute inset-0 h-full w-full object-cover" src={heroVideo.url} autoPlay muted loop playsInline aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-background/75" />
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]" />
        <div className="relative mx-auto max-w-5xl px-6 pb-28 pt-20 text-center md:pt-28">
          <p className="eyebrow fade-up">Zimbabwe · Tourism & Hospitality · Workforce 2031</p>
          <h1 className="fade-up mx-auto mt-6 max-w-4xl text-4xl font-semibold uppercase leading-[1.02] md:text-7xl">
            The future of tourism workforce <span className="text-gradient">readiness</span>
          </h1>
          <p className="fade-up mt-6 font-display text-lg text-foreground/90 md:text-xl">From classroom knowledge to real-world capability.</p>
          <p className="fade-up mx-auto mt-4 max-w-2xl text-muted-foreground">
            An AI-powered ecosystem where tourism and hospitality professionals learn continuously, practise real industry scenarios, build verifiable skills and connect with the industry.
          </p>
          <div className="fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6">
              <Link to="/start">
                Explore the Ecosystem <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 px-6 text-muted-foreground">
              <a href="#how">See How It Works</a>
            </Button>
          </div>
          <div className="mx-auto mt-16 flex max-w-xl items-center gap-3">
            {["Learn", "Practise", "Prove", "Connect", "Discover"].map((w, i) => (
              <div key={w} className="flex flex-1 items-center gap-3">
                <span className={cn("eyebrow", i === 2 && "text-gold")}>{w}</span>
                {i < 4 && <span className="flow-line h-px flex-1 opacity-60" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENCE */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="eyebrow">The difference</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold uppercase md:text-5xl">Not just another learning platform.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Research shows graduates arrive with theory but limited exposure to the systems industry runs on — reservation platforms, ticket booking, digital guest service and AI tools. This ecosystem closes that gap.
          </p>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border bg-border md:grid-cols-2">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="group bg-background p-8 transition-colors hover:bg-surface md:p-10">
                <div className="mb-8 overflow-hidden rounded-2xl border">
                  <img src={p.img} alt={p.title} width={1024} height={640} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="flex items-center justify-between">
                  <p.icon className={cn("h-6 w-6", p.tone)} strokeWidth={1.5} />
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-10 text-xl font-semibold uppercase md:text-2xl">{p.title}</h3>
                <p className="mt-3 max-w-md text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PASSPORT */}
      <section className="border-t bg-surface/40">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Tourism Skills Passport</p>
            <h2 className="mt-3 text-3xl font-semibold uppercase md:text-5xl">
              Your skills. <span className="text-gold">Your proof.</span>
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              A premium digital professional identity that proves capability — not merely course completion. Every entry is backed by evidence from learning, simulation and industry exposure.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Technical competencies", "Digital competencies", "Simulation achievements", "Completed learning", "Industry badges", "Professional development", "Verified experience"].map((x) => (
                <li key={x} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-lift)]">
            <img src={passportImg} alt="A private, verified Tourism Skills Passport card with a gold seal and locked identity details" width={1024} height={1024} loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* INTERACTIVE MOMENT */}
      <section id="how" className="scroll-mt-10 border-t">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold uppercase md:text-5xl">What does readiness look like?</h2>
          <div className="mt-14 grid gap-10 lg:grid-cols-[320px_1fr]">
            <ol className="relative space-y-1">
              <span className="absolute bottom-6 left-[15px] top-6 w-px bg-border" />
              {STAGES.map((st, i) => (
                <li key={st.name}>
                  <button
                    onClick={() => setStage(i)}
                    className={cn(
                      "relative flex w-full items-center gap-4 rounded-xl px-0 py-3 text-left transition-colors",
                      i === stage ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background font-mono text-xs", i === stage && "border-gold text-gold", i < stage && "border-gold/50 bg-gold/10 text-gold")}>
                      {i + 1}
                    </span>
                    <span className="font-display text-lg font-semibold uppercase tracking-wide">{st.name}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div key={stage} className="fade-up rounded-3xl border bg-card p-8 md:p-10">
              <p className="eyebrow text-gold">Stage {stage + 1} · {s.name}</p>
              <p className="mt-4 font-display text-2xl font-semibold md:text-3xl">"{s.example}"</p>
              <p className="mt-4 max-w-xl text-muted-foreground">{s.detail}</p>
              <div className="mt-8 space-y-2">
                {s.visual.map((v, i) => (
                  <div key={v} className="fade-up flex items-center gap-3 rounded-xl border bg-surface-2/60 px-4 py-3 font-mono text-sm" style={{ animationDelay: `${i * 90}ms` }}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-gold" : "bg-cyan")} />
                    {v}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex gap-2">
                <Button variant="outline" size="sm" disabled={stage === 0} onClick={() => setStage(stage - 1)}>Previous</Button>
                {stage < STAGES.length - 1 ? (
                  <Button size="sm" onClick={() => setStage(stage + 1)}>Next stage <ArrowRight className="ml-1 h-4 w-4" /></Button>
                ) : (
                  <Button asChild size="sm"><Link to="/start">Start your journey <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNALS */}
      <section className="border-t bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Industry signals</p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold uppercase md:text-4xl">Know what is changing before the workplace does.</h2>
            </div>
            <BookOpen className="hidden h-6 w-6 text-muted-foreground md:block" strokeWidth={1.5} />
          </div>
          <div className="mt-10 divide-y rounded-2xl border bg-card">
            {TRENDS.map((t) => (
              <div key={t.id} className="grid items-center gap-3 px-6 py-5 md:grid-cols-[1fr_140px_80px]">
                <div>
                  <p className="font-display font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.impact}</p>
                </div>
                <Signal value={t.momentum} />
                <span className="font-mono text-sm text-cyan">{t.change}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center">
          <h2 className="text-3xl font-semibold uppercase md:text-5xl">
            Learn. Practise. Prove. Connect. <span className="text-gradient">Stay ahead.</span>
          </h2>
          <Button asChild size="lg" className="mt-10 h-12 px-6">
            <Link to="/start">Explore the Ecosystem <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <Logo />
          <p>A national workforce readiness initiative for Zimbabwe's tourism & hospitality sector.</p>
        </div>
      </footer>
    </div>
  );
}
