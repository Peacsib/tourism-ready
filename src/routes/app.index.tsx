import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Bot, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, Meter, Panel, ReadinessPath, Signal, StatePill, Tag } from "@/components/tw/motifs";
import { ARTICLES, COURSES, TRENDS, type RoleId } from "@/lib/data";
import { displayName, fetchJobs, fetchMembers, type Job, type Member } from "@/lib/social";
import { MemberAvatar } from "@/components/tw/member-avatar";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Overview — Tourism Workforce 2031" }, { name: "description", content: "Your workforce readiness snapshot and next step." }] }),
  component: Overview,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const RECOMMEND: Record<RoleId, { label: string; title: string; why: string; cta: string; to: string }> = {
  student: { label: "Recommended next challenge", title: "Handle a high-volume hotel reservation scenario.", why: "Reservation Management is your closest skill to 'Demonstrated' — and it's required by 91% of the placements you match.", cta: "Start Simulation", to: "/app/simulations/reservation-desk" },
  professional: { label: "Recommended upskilling", title: "Recover an overbooked guest without losing the relationship.", why: "Supervisor roles you're tracking list service recovery and revenue awareness as core competencies.", cta: "Start Simulation", to: "/app/simulations/overbooking" },
  employer: { label: "Recommended action", title: "Review 6 reservation-ready candidates with verified passports.", why: "Your open Front Office Internship closes in 3 weeks. These candidates demonstrated reservation skills in simulation.", cta: "View candidates", to: "/app/network" },
  educator: { label: "Recommended action", title: "Assign the Reservation Desk simulation to your cohort.", why: "62% of your learners are still 'Developing' in booking systems — the largest gap against industry expectations.", cta: "Preview simulation", to: "/app/simulations/reservation-desk" },
  entrepreneur: { label: "Recommended next step", title: "Launch direct online booking for your tours.", why: "Operators in Kariba who moved bookings online grew direct revenue this season. Start with the Digital Tourism Business course.", cta: "Continue Learning", to: "/app/learning" },
};

function Overview() {
  const { persona, competencies, attempts, connections, courseProgress } = useApp();
  const role = persona.role;
  const rec = RECOMMEND[role];
  const demonstrated = competencies.filter((c) => c.state === "Demonstrated" || c.state === "Verified").length;
  const avgLearning = Math.round(COURSES.reduce((t, c) => t + (courseProgress[c.id] ?? c.progress), 0) / COURSES.length);

  const snapshot = [
    { label: "Skills developing", value: competencies.filter((c) => c.state !== "Verified").length, note: `${demonstrated} demonstrated` },
    { label: "Simulations completed", value: 3 + attempts.length, note: attempts.length ? "+ this session" : "Last: Guest Check-in" },
    { label: "Learning progress", value: `${avgLearning}%`, note: "Across 8 pathways" },
    { label: "Industry knowledge", value: "7", note: "Briefs read this month" },
    { label: "Connections", value: connections.length + 38, note: "Across 5 sectors" },
  ];

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <p className="eyebrow">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{greeting()}, {persona.firstName}.</h1>
        <p className="mt-2 text-muted-foreground">
          {role === "employer" ? "Your workforce at a glance — and who's ready to join it." : role === "educator" ? "How ready your learners are for industry today." : "Your next step toward industry readiness."}
        </p>
      </div>

      {/* SNAPSHOT */}
      <Panel className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Workforce readiness snapshot</p>
            <Tag tone="cyan">Goal · {persona.goal}</Tag>
          </div>
          <div className="mt-8">
            <p className="mb-4 text-sm text-muted-foreground">Your journey</p>
            <ReadinessPath active={attempts.some((a) => a.addedToPassport) ? 3 : 2} progress={0.4} />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-5">
            {snapshot.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-semibold">{s.value}</p>
                <p className="mt-1 text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* CONTINUE YOUR JOURNEY */}
        <Panel className="border-gold/25">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles className="h-4 w-4" />
            <p className="eyebrow text-gold">Continue your journey · AI Tutor</p>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{rec.label}</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">"{rec.title}"</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">{rec.why}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to={rec.to}>{rec.cta} <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="ghost" className="text-muted-foreground"><Link to="/app/tutor"><Bot className="mr-1 h-4 w-4" /> Ask AI Tutor why</Link></Button>
          </div>
        </Panel>

        <RoleFocus role={role} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <div className="flex items-center justify-between">
            <p className="eyebrow">Skills in motion</p>
            <Link to="/app/passport" className="text-xs text-muted-foreground hover:text-foreground">Passport →</Link>
          </div>
          <ul className="mt-5 space-y-4">
            {[...competencies].sort((a, b) => b.level - a.level).slice(2, 7).map((c) => (
              <li key={c.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{c.name}</span>
                  <StatePill state={c.state} />
                </div>
                <Meter value={c.level} tone={c.state === "Practising" || c.state === "Developing" ? "cyan" : "gold"} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <p className="eyebrow">Industry signals</p>
            <Link to="/app/intelligence" className="text-xs text-muted-foreground hover:text-foreground">Intelligence →</Link>
          </div>
          <ul className="mt-5 space-y-4">
            {TRENDS.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3">
                <span className="text-sm">{t.name}</span>
                <span className="flex items-center gap-3"><Signal value={t.momentum} /><span className="w-10 text-right font-mono text-xs text-cyan">{t.change}</span></span>
              </li>
            ))}
          </ul>
          <Link to="/app/intelligence" className="mt-6 block rounded-xl border bg-surface-2/50 p-4 transition-colors hover:border-foreground/20">
            <p className="eyebrow">Latest brief</p>
            <p className="mt-2 text-sm font-medium">{ARTICLES[0]!.title}</p>
          </Link>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <p className="eyebrow">Matched opportunities</p>
            <Link to="/app/opportunities" className="text-xs text-muted-foreground hover:text-foreground">All →</Link>
          </div>
          <RealJobsList />
        </Panel>
      </div>
    </div>
  );
}

function RoleFocus({ role }: { role: RoleId }) {
  if (role === "employer") {
        return (
      <Panel>
        <p className="eyebrow">Candidate discovery</p>
        <RealCandidates />
        <p className="mt-5 eyebrow">Team training needs</p>
        <div className="mt-3 space-y-3 text-sm">
          {[["Booking systems", 64], ["AI-assisted service", 71], ["Service recovery", 38]].map(([k, v]) => (
            <div key={k as string}><div className="mb-1 flex justify-between"><span>{k}</span><span className="font-mono text-xs text-muted-foreground">{v}% of staff need</span></div><Meter value={v as number} tone="cyan" /></div>
          ))}
        </div>
      </Panel>
    );
  }
  if (role === "educator") {
    return (
      <Panel>
        <p className="eyebrow">Cohort readiness · Tourism Mgmt Year 2</p>
        <p className="mt-4 font-display text-4xl font-semibold">48 <span className="text-base font-normal text-muted-foreground">learners</span></p>
        <div className="mt-6 space-y-4 text-sm">
          {[["Reservation systems", 38], ["Guest communication", 81], ["Ticket booking", 29], ["AI readiness", 44], ["Industry alignment", 67]].map(([k, v]) => (
            <div key={k as string}><div className="mb-1 flex justify-between"><span>{k}</span><span className="font-mono text-xs text-muted-foreground">{v}%</span></div><Meter value={v as number} tone={(v as number) < 50 ? "cyan" : "gold"} /></div>
          ))}
        </div>
        <Button asChild variant="outline" size="sm" className="mt-6"><Link to="/app/learning">Open learning resources</Link></Button>
      </Panel>
    );
  }
  const items: Record<Exclude<RoleId, "employer" | "educator">, { t: string; d: string; to: string }[]> = {
    student: [
      { t: "Hotel Operations Fundamentals", d: "Module 5 of 6 · Cancellations", to: "/app/learning" },
      { t: "Mentorship: Farai Mutasa", d: "4 slots open for front office", to: "/app/network" },
      { t: "Victoria Falls Readiness Clinic", d: "Field Hub · 04 Nov", to: "/app/hubs" },
    ],
    professional: [
      { t: "Revenue Management Certificate", d: "8 weeks · simulation-assessed", to: "/app/opportunities" },
      { t: "AI for Hospitality Professionals", d: "15% complete", to: "/app/learning" },
      { t: "Guest Experience Supervisor role", d: "Rainbow Towers · 72% match", to: "/app/opportunities" },
    ],
    entrepreneur: [
      { t: "Starting a Digital Tourism Business", d: "6 modules · Online booking", to: "/app/learning" },
      { t: "Community tourism in Mutoko", d: "Intelligence brief", to: "/app/intelligence" },
      { t: "Kariba Hospitality Skills Week", d: "Field Hub · 14 Oct", to: "/app/hubs" },
    ],
  };
  return (
    <Panel>
      <p className="eyebrow">Focus for you</p>
      <ul className="mt-5 divide-y">
        {items[role].map((i) => (
          <li key={i.t}>
            <Link to={i.to} className="group flex items-center justify-between gap-3 py-4">
              <span className="min-w-0">
                <span className="block truncate font-medium group-hover:text-gold">{i.t}</span>
                <span className="block truncate text-sm text-muted-foreground">{i.d}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-gold" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function RealJobsList() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  useEffect(() => { fetchJobs().then((j) => setJobs(j.filter((x) => x.active).slice(0, 4))).catch(() => setJobs([])); }, []);
  if (jobs === null) return <p className="mt-5 text-sm text-muted-foreground">Loading…</p>;
  if (!jobs.length) return <p className="mt-5 text-sm text-muted-foreground">No employer has posted yet. New roles appear here as soon as they're published.</p>;
  return (
    <ul className="mt-5 divide-y">
      {jobs.map((o) => (
        <li key={o.id}>
          <Link to="/app/opportunities" className="flex items-center justify-between gap-3 py-3 hover:text-gold">
            <span className="min-w-0"><span className="block truncate text-sm font-medium">{o.title}</span><span className="block truncate text-xs text-muted-foreground">{o.organisation} · {o.location}</span></span>
            <span className="text-xs text-muted-foreground">{o.job_type}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RealCandidates() {
  const { user } = useAuth();
  const [list, setList] = useState<Member[] | null>(null);
  useEffect(() => { fetchMembers(user?.id).then((m) => setList(m.filter((x) => x.role === "student" || x.role === "professional").slice(0, 5))).catch(() => setList([])); }, [user]);
  if (list === null) return <p className="mt-5 text-sm text-muted-foreground">Loading…</p>;
  if (!list.length) return <p className="mt-5 text-sm text-muted-foreground">No candidates have joined yet. Post an opportunity to attract applicants.</p>;
  return (
    <ul className="mt-5 space-y-3">
      {list.map((p) => (
        <li key={p.id}>
          <Link to="/app/people/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent">
            <MemberAvatar m={p} size="sm" />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{displayName(p)}</span><span className="block truncate text-xs text-muted-foreground">{p.headline || p.location || "Member"}</span></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
