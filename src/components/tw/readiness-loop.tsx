import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SIMULATIONS } from "@/lib/data";
import { useApp } from "@/lib/store";

const LOOP = [
  { to: "/app/intelligence", label: "Industry Intelligence", why: "See which skills the industry is asking for" },
  { to: "/app/tutor", label: "AI Tutor", why: "Close your skills gap with guided practice" },
  { to: "/app/learning", label: "Learning", why: "Build the skill with a short course" },
  { to: "/app/simulations", label: "Simulations", why: "Practise it in a real workplace scenario" },
  { to: "/app/passport", label: "Skills Passport", why: "Turn practice into verified evidence" },
  { to: "/app/network", label: "Network", why: "Meet professionals who use this skill" },
  { to: "/app/opportunities", label: "Opportunities", why: "Apply your proven skills" },
] as const;

export function ReadinessLoop({ pathname }: { pathname: string }) {
  const { competencies } = useApp();
  const idx = LOOP.findIndex((s) => pathname.startsWith(s.to));
  if (idx === -1) return null;
  const next = LOOP[(idx + 1) % LOOP.length]!;
  const gap = [...competencies].filter((c) => c.state !== "Verified").sort((a, b) => a.level - b.level)[0];
  const key = gap?.name.toLowerCase().split(" ")[0] ?? "";
  const sim = gap ? SIMULATIONS.find((s) => s.available && s.skills.some((k) => k.toLowerCase().includes(key))) : undefined;

  return (
    <div className="mt-10 grid gap-3 rounded-2xl border bg-card p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <p className="eyebrow text-cyan">Your readiness loop</p>
        {gap ? (
          <p className="mt-1 text-sm">
            Biggest skills gap: <span className="font-medium">{gap.name}</span>{" "}
            <span className="text-muted-foreground">({gap.state} · {gap.level}%)</span>
            {sim && <> · practise it in <Link to="/app/simulations/$id" params={{ id: sim.id }} className="font-medium text-gold hover:underline">{sim.title}</Link></>}
          </p>
        ) : <p className="mt-1 text-sm">All passport skills are verified.</p>}
        <p className="mt-1 text-xs text-muted-foreground">Next: {next.why}.</p>
      </div>
      <Link to={next.to} className="inline-flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:border-gold/50 hover:text-gold">
        {next.label} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
