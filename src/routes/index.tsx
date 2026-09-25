import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Bot, Check, Network, Radar, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, Signal, Tag } from "@/components/tw/motifs";
import { TRENDS } from "@/lib/data";
import { cn } from "@/lib/utils";
import passportImg from "@/assets/passport-confidential.jpg";
import heroVideo from "@/assets/hero-live.mp4";
import imgTutor from "@/assets/pillar-tutor.jpg";
import imgSim from "@/assets/pillar-sim.jpg";
import imgIntel from "@/assets/pillar-intel.jpg";
import imgNet from "@/assets/pillar-network.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tourism Workforce 2031 — The future of tourism workforce readiness" },
      { name: "description", content: "An AI-powered ecosystem where Zimbabwe's tourism and hospitality workforce learns, practises real industry scenarios, proves skills and connects with industry." },
      { property: "og:site_name", content: "Tourism Workforce 2031" },
      { property: "og:title", content: "Tourism Workforce 2031 — The future of tourism workforce readiness" },
      { property: "og:description", content: "From classroom knowledge to real-world capability. An AI-powered ecosystem for Zimbabwe's tourism & hospitality workforce." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://tourism-ready.vercel.app/" },
      { property: "og:image", content: "https://tourism-ready.vercel.app/og-image.jpg" },
      { property: "og:image:secure_url", content: "https://tourism-ready.vercel.app/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1024" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "Tourism Workforce 2031" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tourism Workforce 2031 — The future of tourism workforce readiness" },
      { name: "twitter:description", content: "From classroom knowledge to real-world capability. Learn, practise, prove, connect." },
      { name: "twitter:image", content: "https://tourism-ready.vercel.app/og-image.jpg" },
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

const HERO_WORDS = ["readiness", "excellence", "confidence", "careers"];

function Landing() {
  const [stage, setStage] = useState(0);
  const [word, setWord] = useState(0);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const a = setInterval(() => setWord((w) => (w + 1) % HERO_WORDS.length), 2600);
    const b = setInterval(() => setStep((s) => (s + 1) % 5), 1400);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);
  const s = STAGES[stage]!;

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Sticky glass navbar */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-background/80 border-b border-border/40 transition-colors">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-5">
          <Logo />
          <div className="flex items-center gap-2">
            <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline">How it works</a>
            <Button asChild size="sm" variant="outline" className="h-9 px-3.5 text-xs sm:text-sm rounded-xl font-medium shadow-2xs">
              <Link to="/start">Enter platform</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative min-h-[calc(100svh-65px)] flex flex-col justify-center overflow-hidden">
        <video className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_35%] brightness-[1.04]" autoPlay muted loop playsInline aria-hidden="true">
          <source src={heroVideo} type="video/mp4" />
          <source src="/hero-live.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-background/35" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/95" />
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-40" />
        <div className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)] opacity-40" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-20 text-center flex flex-col items-center justify-center my-auto">
          {/* Live indicator badge */}
          <div className="fade-up inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3.5 py-1 text-[11px] sm:text-xs font-mono tracking-wider backdrop-blur-md shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
            </span>
            <span className="text-foreground/90 font-medium uppercase">Zimbabwe · Workforce 2031</span>
          </div>

          <h1 className="mx-auto mt-4 sm:mt-6 max-w-4xl text-3xl sm:text-5xl md:text-7xl font-semibold uppercase tracking-tight leading-[1.08] sm:leading-[1.02]">
            {"The future of tourism workforce".split(" ").map((w, i) => (
              <span key={i} className="hero-word" style={{ animationDelay: `${i * 90}ms` }}>{w}&nbsp;</span>
            ))}
            <span className="relative inline-block overflow-hidden align-bottom">
              <span key={word} className="hero-swap text-gradient inline-block">{HERO_WORDS[word]}</span>
            </span>
          </h1>

          <p className="fade-up mt-3 sm:mt-5 font-display text-base sm:text-lg md:text-xl text-foreground/90 font-medium max-w-xl">
            From classroom knowledge to real-world capability.
          </p>

          <p className="fade-up mx-auto mt-2 sm:mt-3 max-w-xl text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
            An AI-powered ecosystem where tourism and hospitality professionals learn continuously, practise real industry scenarios, build verifiable skills and connect.
          </p>

          <div className="fade-up mt-6 sm:mt-8 flex flex-col w-full sm:w-auto items-center justify-center gap-2.5 sm:gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-7 rounded-2xl font-medium shadow-md shadow-primary/10 active:scale-[0.98] transition-transform">
              <Link to="/start">
                Explore the Ecosystem <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto h-11 px-5 text-sm text-muted-foreground hover:text-foreground">
              <a href="#how">See How It Works</a>
            </Button>
          </div>

          {/* Workflow pill bar */}
          <div className="mx-auto mt-6 sm:mt-12 flex items-center justify-center gap-1 sm:gap-2.5 p-1 sm:p-1.5 rounded-full border border-border/50 bg-background/75 backdrop-blur-md shadow-2xs max-w-full overflow-x-auto no-scrollbar">
            {["Learn", "Practise", "Prove", "Connect", "Discover"].map((w, i) => (
              <div
                key={w}
                className={cn(
                  "px-2.5 sm:px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-mono transition-all duration-500 whitespace-nowrap",
                  i === step
                    ? "bg-foreground text-background font-semibold shadow-2xs scale-105"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENCE */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-24">
          <p className="eyebrow">The difference</p>
          <h2 className="mt-3 max-w-2xl text-2xl sm:text-3xl md:text-5xl font-semibold uppercase">Not just another learning platform.</h2>
          <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground">
            Research shows graduates arrive with theory but limited exposure to the systems industry runs on — reservation platforms, ticket booking, digital guest service and AI tools. This ecosystem closes that gap.
          </p>
          <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-px overflow-hidden rounded-2xl sm:rounded-3xl border-0 sm:border bg-transparent sm:bg-border md:grid-cols-2">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="group bg-background p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-none border sm:border-0 transition-colors hover:bg-surface shadow-xs sm:shadow-none">
                <div className="mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl border">
                  <img src={p.img} alt={p.title} width={1024} height={640} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="flex items-center justify-between">
                  <p.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", p.tone)} strokeWidth={1.5} />
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-6 sm:mt-10 text-lg sm:text-xl md:text-2xl font-semibold uppercase">{p.title}</h3>
                <p className="mt-2 sm:mt-3 max-w-md text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PASSPORT */}
      <section className="border-t bg-surface/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 sm:gap-14 px-4 sm:px-6 py-14 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Tourism Skills Passport</p>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-5xl font-semibold uppercase">
              Your skills. <span className="text-gold">Your proof.</span>
            </h2>
            <p className="mt-3 sm:mt-4 max-w-lg text-sm sm:text-base text-muted-foreground">
              A premium digital professional identity that proves capability — not merely course completion. Every entry is backed by evidence from learning, simulation and industry exposure.
            </p>
            <ul className="mt-6 sm:mt-8 grid gap-2.5 sm:gap-3 sm:grid-cols-2">
              {["Technical competencies", "Digital competencies", "Simulation achievements", "Completed learning", "Industry badges", "Professional development", "Verified experience"].map((x) => (
                <li key={x} className="flex items-center gap-2 text-xs sm:text-sm">
                  <Check className="h-4 w-4 text-gold flex-shrink-0" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border bg-card shadow-[var(--shadow-lift)]">
            <img src={passportImg} alt="A private, verified Tourism Skills Passport card with a gold seal and locked identity details" width={1024} height={1024} loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* INTERACTIVE MOMENT */}
      <section id="how" className="scroll-mt-10 border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-24">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-2xl sm:text-3xl md:text-5xl font-semibold uppercase">What does readiness look like?</h2>
          <div className="mt-8 sm:mt-14 grid gap-6 sm:gap-10 lg:grid-cols-[320px_1fr]">
            <ol className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:space-y-1 relative no-scrollbar">
              <span className="hidden lg:block absolute bottom-6 left-[15px] top-6 w-px bg-border" />
              {STAGES.map((st, i) => (
                <li key={st.name} className="flex-shrink-0">
                  <button
                    onClick={() => setStage(i)}
                    className={cn(
                      "relative flex items-center gap-2.5 sm:gap-4 rounded-xl px-3 py-2 sm:px-0 sm:py-3 text-left transition-colors border lg:border-0",
                      i === stage ? "text-foreground border-gold/40 bg-surface/80 lg:bg-transparent" : "text-muted-foreground border-border/50 hover:text-foreground",
                    )}
                  >
                    <span className={cn("relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border bg-background font-mono text-xs flex-shrink-0", i === stage && "border-gold text-gold font-bold", i < stage && "border-gold/50 bg-gold/10 text-gold")}>
                      {i + 1}
                    </span>
                    <span className="font-display text-xs sm:text-base lg:text-lg font-semibold uppercase tracking-wide whitespace-nowrap lg:whitespace-normal">{st.name}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div key={stage} className="fade-up rounded-2xl sm:rounded-3xl border bg-card p-5 sm:p-8 md:p-10 shadow-xs">
              <p className="eyebrow text-gold">Stage {stage + 1} · {s.name}</p>
              <p className="mt-3 sm:mt-4 font-display text-xl sm:text-2xl md:text-3xl font-semibold">"{s.example}"</p>
              <p className="mt-2 sm:mt-4 max-w-xl text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">{s.detail}</p>
              <div className="mt-6 sm:mt-8 space-y-2">
                {s.visual.map((v, i) => (
                  <div key={v} className="fade-up flex items-center gap-3 rounded-xl border bg-surface-2/60 px-3.5 py-2.5 sm:px-4 sm:py-3 font-mono text-xs sm:text-sm" style={{ animationDelay: `${i * 90}ms` }}>
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", i === 0 ? "bg-gold" : "bg-cyan")} />
                    <span className="truncate">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 sm:mt-8 flex gap-2">
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-24">
          <div className="flex flex-col justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Industry signals</p>
              <h2 className="mt-3 max-w-xl text-2xl sm:text-3xl md:text-4xl font-semibold uppercase">Know what is changing before the workplace does.</h2>
            </div>
            <BookOpen className="hidden h-6 w-6 text-muted-foreground md:block" strokeWidth={1.5} />
          </div>
          <div className="mt-8 sm:mt-10 divide-y rounded-2xl border bg-card shadow-xs">
            {TRENDS.map((t) => (
              <div key={t.id} className="grid items-center gap-2 sm:gap-3 p-4 sm:px-6 sm:py-5 md:grid-cols-[1fr_140px_80px]">
                <div>
                  <p className="font-display text-sm sm:text-base font-semibold">{t.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t.impact}</p>
                </div>
                <div className="flex items-center justify-between md:contents">
                  <Signal value={t.momentum} />
                  <span className="font-mono text-xs sm:text-sm text-cyan font-medium">{t.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-28 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold uppercase leading-tight">
            Learn. Practise. Prove. Connect. <span className="text-gradient block sm:inline">Stay ahead.</span>
          </h2>
          <Button asChild size="lg" className="mt-8 sm:mt-10 w-full sm:w-auto h-12 px-7 rounded-2xl font-medium shadow-md shadow-primary/10">
            <Link to="/start">Explore the Ecosystem <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 py-8 text-center text-xs sm:text-sm text-muted-foreground md:flex-row md:text-left">
          <Logo />
          <p>A national workforce readiness initiative for Zimbabwe's tourism & hospitality sector.</p>
        </div>
      </footer>
    </div>
  );
}
