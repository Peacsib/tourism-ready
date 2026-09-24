import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Bookmark, BookmarkCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader, Panel, Signal, Tag } from "@/components/tw/motifs";
import { ARTICLES, CHANGING, TRENDS, type Article } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/intelligence")({
  head: () => ({ meta: [{ title: "Industry Intelligence — Tourism Workforce 2031" }, { name: "description", content: "Know what is changing before the workplace changes around you." }] }),
  component: Intelligence,
});

function Intelligence() {
  const [trend, setTrend] = useState(TRENDS[0]!.id);
  const [open, setOpen] = useState<Article | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const t = TRENDS.find((x) => x.id === trend)!;
  const briefs = ARTICLES.filter((a) => a.kind === "brief");
  const research = ARTICLES.filter((a) => a.kind === "research");
  const toggleSave = (id: string) => {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    toast.success(saved.includes(id) ? "Removed from saved" : "Saved to your reading list");
  };

  return (
    <div>
      <PageHeader eyebrow="Stay ahead" title="Industry Intelligence" subtitle="Know what is changing before the workplace changes around you." />

      {/* TREND SIGNALS */}
      <Panel className="mb-6">
        <p className="eyebrow">Trend signals</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <ul className="divide-y">
            {TRENDS.map((x) => (
              <li key={x.id}>
                <button onClick={() => setTrend(x.id)} className={cn("flex w-full items-center justify-between gap-3 py-3 text-left transition-colors", trend === x.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <span className="flex items-center gap-3">
                    <span className={cn("h-1.5 w-1.5 rounded-full", trend === x.id ? "bg-cyan" : "bg-transparent")} />
                    <span className="font-medium">{x.name}</span>
                  </span>
                  <span className="flex items-center gap-3"><Signal value={x.momentum} /><span className="w-10 text-right font-mono text-xs text-cyan">{x.change}</span></span>
                </button>
              </li>
            ))}
          </ul>
          <div key={t.id} className="fade-up rounded-2xl border bg-surface-2/40 p-6">
            <p className="eyebrow text-cyan">Signal · momentum {t.momentum}/100</p>
            <h2 className="mt-3 text-2xl font-semibold">{t.name}</h2>
            <p className="mt-3 text-muted-foreground">{t.note}</p>
            <div className="mt-6 border-t pt-4">
              <p className="eyebrow text-gold">Why it matters</p>
              <p className="mt-2">{t.impact}</p>
            </div>
          </div>
        </div>
      </Panel>

      {/* BRIEFS — magazine style */}
      <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-sm font-semibold uppercase tracking-wider">Industry briefs</h2></div>
      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        {briefs.map((a, i) => (
          <article key={a.id} className={cn("lift flex flex-col rounded-2xl border bg-card p-6", i === 0 && "lg:row-span-2 lg:p-8")}>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground"><Tag tone="cyan">{a.category}</Tag>{a.source} · {a.date}</div>
            <h3 className={cn("mt-4 font-semibold", i === 0 ? "text-2xl md:text-3xl" : "text-lg")}>{a.title}</h3>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{a.summary}</p>
            <div className="mt-5 rounded-xl border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm"><span className="eyebrow text-gold">Why it matters · </span>{a.why}</div>
            <div className="mt-5 flex items-center gap-2">
              <Button size="sm" onClick={() => setOpen(a)}>Explore <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => toggleSave(a.id)} aria-label="Save">{saved.includes(a.id) ? <BookmarkCheck className="h-4 w-4 text-gold" /> : <Bookmark className="h-4 w-4" />}</Button>
              <span className="ml-auto font-mono text-xs text-muted-foreground">{a.readTime}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <p className="eyebrow">What's changing · technology → skill</p>
          <ol className="mt-6 space-y-0">
            {CHANGING.map((c, i) => (
              <li key={c.year} className="grid grid-cols-[56px_1fr] gap-4">
                <div className="flex flex-col items-center">
                  <span className={cn("font-mono text-xs", c.year === "2031" ? "text-gold" : "text-muted-foreground")}>{c.year}</span>
                  {i < CHANGING.length - 1 && <span className="mt-2 w-px flex-1 bg-border" />}
                </div>
                <div className="pb-6">
                  <p className="font-medium">{c.tech}</p>
                  <p className="text-sm text-muted-foreground">Skill needed: <span className="text-cyan">{c.skill}</span></p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel>
          <p className="eyebrow">Research & sector insights</p>
          <ul className="mt-4 divide-y">
            {research.map((r) => (
              <li key={r.id}>
                <button onClick={() => setOpen(r)} className="group flex w-full gap-4 py-4 text-left">
                  <FileText className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span>
                    <span className="block font-medium group-hover:text-gold">{r.title}</span>
                    <span className="mt-1 block font-mono text-xs text-muted-foreground">{r.source} · {r.date} · {r.readTime}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <p className="eyebrow">{open.category} · {open.date}</p>
                <SheetTitle className="text-2xl leading-tight">{open.title}</SheetTitle>
                <SheetDescription>{open.source} · {open.readTime} read</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8 text-sm leading-relaxed">
                <p>{open.summary}</p>
                <div className="rounded-xl border-l-2 border-gold bg-gold/5 px-4 py-3"><p className="eyebrow text-gold">Why it matters</p><p className="mt-1">{open.why}</p></div>
                <div>
                  <p className="eyebrow">What to do next</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>Discuss this with the AI Tutor to see how it applies to your role.</li>
                    <li>Practise a related simulation to turn awareness into capability.</li>
                    <li>Share with your network to hear practitioner perspectives.</li>
                  </ul>
                </div>
                <Button onClick={() => toggleSave(open.id)} variant="outline">{saved.includes(open.id) ? "Saved" : "Save for later"}</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
