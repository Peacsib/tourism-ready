import { Link } from "@tanstack/react-router";
import { IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Panel, StatePill, Tag } from "@/components/tw/motifs";
import type { Competency } from "@/lib/data";

export type ProfileData = {
  initials: string;
  name: string;
  role: string;
  organisation: string;
  location: string;
  statement: string;
  competencies: Pick<Competency, "id" | "name" | "state">[];
  experience: { title: string; detail: string; date: string }[];
  simulations: string[];
  development: string[];
  interests: string[];
  connections: number;
  achievements: string[];
};

export function ProfileView({ p, actions, own }: { p: ProfileData; actions?: React.ReactNode; own?: boolean }) {
  return (
    <div className="space-y-6">
      <Panel className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar initials={p.initials} size="xl" tone="gold" />
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">{p.name}</h1>
              <p className="text-muted-foreground">{p.role} · {p.organisation}</p>
              <p className="font-mono text-xs text-muted-foreground">{p.location}</p>
              <p className="mt-3 max-w-xl text-sm">{p.statement}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {own ? <Button asChild><Link to="/app/passport"><IdCard className="mr-1 h-4 w-4" /> View Skills Passport</Link></Button> : null}
            {actions}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <p className="eyebrow">Skills passport</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {p.competencies.map((c) => <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm"><span className="truncate">{c.name}</span><StatePill state={c.state} /></li>)}
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow">Connections</p>
          <p className="mt-3 font-display text-4xl font-semibold">{p.connections}</p>
          <p className="text-sm text-muted-foreground">across students, employers & educators</p>
          <p className="eyebrow mt-6">Industry interests</p>
          <div className="mt-3 flex flex-wrap gap-2">{p.interests.map((i) => <Tag key={i} tone="cyan">{i}</Tag>)}</div>
        </Panel>
        <Panel className="lg:col-span-2">
          <p className="eyebrow">Experience</p>
          <ul className="mt-4 divide-y">
            {p.experience.map((e) => <li key={e.title} className="flex justify-between gap-4 py-3"><span><span className="block font-medium">{e.title}</span><span className="text-sm text-muted-foreground">{e.detail}</span></span><span className="shrink-0 font-mono text-xs text-muted-foreground">{e.date}</span></li>)}
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow">Simulations</p>
          <ul className="mt-3 space-y-2 text-sm">{p.simulations.map((s) => <li key={s} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gold" />{s}</li>)}</ul>
          <p className="eyebrow mt-6">Professional development</p>
          <ul className="mt-3 space-y-2 text-sm">{p.development.map((s) => <li key={s} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan" />{s}</li>)}</ul>
        </Panel>
        <Panel className="lg:col-span-3">
          <p className="eyebrow">Achievements</p>
          <div className="mt-3 flex flex-wrap gap-2">{p.achievements.map((a) => <Tag key={a} tone="gold">{a}</Tag>)}</div>
        </Panel>
      </div>
    </div>
  );
}
