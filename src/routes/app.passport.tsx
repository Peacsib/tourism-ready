import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Download, Eye, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, Meter, PageHeader, Panel, SkillsConstellation, StatePill, Tag } from "@/components/tw/motifs";
import { BADGES, type CompetencyCategory } from "@/lib/data";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/passport")({
  head: () => ({ meta: [{ title: "Tourism Skills Passport — Tourism Workforce 2031" }, { name: "description", content: "A living record of what you can actually do." }] }),
  component: Passport,
});

const CATS: CompetencyCategory[] = ["Operations", "Customer Experience", "Digital Skills", "AI Readiness", "Management", "Tourism Knowledge"];
const STATES = ["Developing", "Practising", "Demonstrated", "Verified"] as const;

function Passport() {
  const { persona, competencies, timeline } = useApp();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>("res");
  const [cat, setCat] = useState<CompetencyCategory | "All">("All");
  const [view, setView] = useState(false);
  const sel = competencies.find((c) => c.id === selected);
  const shown = competencies.filter((c) => cat === "All" || c.category === cat);
  const passportId = `ZW-2031-${persona.initials}${persona.id.length}417`;
  const verifyUrl = user ? `${window.location.origin}/verify/${user.id}` : null;

  const share = async () => {
    const url = verifyUrl ?? `${window.location.origin}/verify/${persona.id}`;
    try { await navigator.clipboard.writeText(url); toast.success("Passport link copied", { description: url }); }
    catch { toast.info("Share link", { description: url }); }
  };

  const download = () => {
    const lines = [
      `TOURISM SKILLS PASSPORT — ${passportId}`, `${persona.name} · ${persona.title} · ${persona.location}`, "",
      "CORE COMPETENCIES", ...competencies.map((c) => `- ${c.name} (${c.category}): ${c.state}, ${c.level}/100`), "",
      "EXPERIENCE TIMELINE", ...timeline.map((t) => `- ${t.date} · ${t.type}: ${t.title} — ${t.detail}`), "",
      "VERIFIED ACHIEVEMENTS", ...BADGES.map((b) => `- ${b.name} · ${b.tier} · ${b.issuer} · ${b.date}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `skills-passport-${persona.id}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Passport downloaded");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Prove"
        title="Tourism Skills Passport"
        subtitle="A living record of what you can actually do."
        actions={<>
          <Button onClick={() => setView(true)}><Eye className="mr-1 h-4 w-4" /> View Passport</Button>
          <Button variant="outline" onClick={share}><Share2 className="mr-1 h-4 w-4" /> Share Profile</Button>
          {verifyUrl && (
            <Link to="/verify/$id" params={{ id: user!.id }} target="_blank">
              <Button variant="outline"><ExternalLink className="mr-1 h-4 w-4" /> Public View</Button>
            </Link>
          )}
          <Button variant="outline" onClick={download}><Download className="mr-1 h-4 w-4" /> Download</Button>
        </>}
      />

      <Panel className="relative mb-6 overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Avatar initials={persona.initials} size="xl" tone="gold" />
            <div>
              <p className="font-display text-2xl font-semibold md:text-3xl">{persona.name}</p>
              <p className="text-muted-foreground">{persona.title}</p>
              <p className="text-sm text-muted-foreground">{persona.location}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center md:gap-8">
            {STATES.map((s) => (
              <div key={s}><p className="font-display text-2xl font-semibold">{competencies.filter((c) => c.state === s).length}</p><p className="eyebrow mt-1">{s}</p></div>
            ))}
          </div>
        </div>
        <p className="relative mt-6 font-mono text-xs text-muted-foreground">Passport ID · {passportId} · Evidence-backed · Issued by Tourism Workforce 2031</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Core competencies · Skills constellation</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {[["bg-muted-foreground", "Developing"], ["bg-cyan", "Practising"], ["bg-gold/70", "Demonstrated"], ["bg-gold", "Verified"]].map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", c)} />{l}</span>)}
            </div>
          </div>
          <div className="mt-2 aspect-[4/3] w-full">
            <SkillsConstellation competencies={competencies} selected={selected} onSelect={setSelected} />
          </div>
          {sel && (
            <div key={sel.id} className="fade-up mt-2 rounded-xl border bg-surface-2/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{sel.name}</p><StatePill state={sel.state} /></div>
              <p className="mt-1 text-xs text-muted-foreground">{sel.category} · level {sel.level}/100</p>
              <div className="mt-3"><Meter value={sel.level} tone={sel.state === "Verified" || sel.state === "Demonstrated" ? "gold" : "cyan"} /></div>
            </div>
          )}
        </Panel>

        <Panel>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {(["All", ...CATS] as const).map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full px-3 py-1 text-xs", cat === c ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>{c}</button>
            ))}
          </div>
          <ul className="mt-3 divide-y">
            {shown.map((c) => (
              <li key={c.id}>
                <button onClick={() => setSelected(c.id)} className={cn("w-full py-3 text-left", selected === c.id && "text-gold")}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm"><span className="truncate">{c.name}</span><StatePill state={c.state} /></div>
                  <Meter value={c.level} tone={c.state === "Verified" || c.state === "Demonstrated" ? "gold" : "cyan"} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <p className="eyebrow">Experience timeline</p>
          <ol className="relative mt-6 space-y-6 border-l pl-6">
            {timeline.map((t) => (
              <li key={t.id} className={cn("relative", t.fresh && "fade-up")}>
                <span className={cn("absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-background", t.type === "Simulation" ? "bg-gold" : t.type === "Learning" ? "bg-cyan" : "bg-muted-foreground")} />
                <div className="flex flex-wrap items-center gap-2"><Tag tone={t.type === "Simulation" ? "gold" : t.type === "Learning" ? "cyan" : "default"}>{t.type}</Tag>{t.fresh && <Tag tone="gold">New</Tag>}<span className="font-mono text-xs text-muted-foreground">{t.date}</span></div>
                <p className="mt-2 font-medium">{t.title}</p>
                <p className="text-sm text-muted-foreground">{t.detail}</p>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel>
          <p className="eyebrow">Verified achievements</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {BADGES.map((b, i) => (
              <div key={b.id} className="fade-up flex flex-col items-center rounded-2xl border bg-surface-2/40 p-4 text-center" style={{ animationDelay: `${i * 100}ms` }}>
                <span className={cn("flex h-14 w-14 items-center justify-center rounded-full border-2", b.tier === "Verified" ? "border-gold bg-gold/10 text-gold" : b.tier === "Demonstrated" ? "border-gold/40 text-gold/80" : "border-border text-muted-foreground")}>
                  <Award className="h-6 w-6" strokeWidth={1.4} />
                </span>
                <p className="mt-3 text-sm font-medium leading-tight">{b.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{b.tier} · {b.date}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Dialog open={view} onOpenChange={setView}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide">Tourism Skills Passport</DialogTitle>
            <DialogDescription className="font-mono text-xs">{passportId}</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-transparent to-cyan/5 p-5">
            <div className="flex items-center gap-4"><Avatar initials={persona.initials} size="lg" tone="gold" /><div><p className="font-display text-xl font-semibold">{persona.name}</p><p className="text-sm text-muted-foreground">{persona.title} · {persona.location}</p></div></div>
            <p className="eyebrow mt-5">Verified & demonstrated</p>
            <div className="mt-2 flex flex-wrap gap-2">{competencies.filter((c) => c.state === "Verified" || c.state === "Demonstrated").map((c) => <Tag key={c.id} tone="gold">{c.name}</Tag>)}</div>
            <p className="eyebrow mt-5">Practising</p>
            <div className="mt-2 flex flex-wrap gap-2">{competencies.filter((c) => c.state === "Practising").map((c) => <Tag key={c.id} tone="cyan">{c.name}</Tag>)}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
