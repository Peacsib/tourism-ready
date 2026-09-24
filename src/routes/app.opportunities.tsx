import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, Check, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Tag } from "@/components/tw/motifs";
import { OPPORTUNITIES } from "@/lib/data";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — Tourism Workforce 2031" }, { name: "description", content: "Internships, placements, mentorship and careers across Zimbabwe's tourism sector." }] }),
  component: Opportunities,
});

const uniq = (a: string[]) => Array.from(new Set(a)).sort();

function Opportunities() {
  const { savedOpps, applied, toggleSaveOpp, apply } = useApp();
  const [f, setF] = useState({ type: "all", location: "all", skill: "all", experience: "all", role: "all" });
  const opts = {
    type: uniq(OPPORTUNITIES.map((o) => o.type)),
    location: uniq(OPPORTUNITIES.map((o) => o.location)),
    skill: uniq(OPPORTUNITIES.flatMap((o) => o.skills)),
    experience: ["Entry", "Mid", "Senior"],
    role: ["Front office", "Travel", "Guest experience", "Management"],
  };
  const roleMatch: Record<string, RegExp> = { "Front office": /front|reserv/i, Travel: /ticket|travel|houseboat/i, "Guest experience": /guest|lodge|placement/i, Management: /supervisor|revenue|management/i };

  const list = useMemo(() => OPPORTUNITIES.filter((o) =>
    (f.type === "all" || o.type === f.type) && (f.location === "all" || o.location === f.location) &&
    (f.skill === "all" || o.skills.includes(f.skill)) && (f.experience === "all" || o.experience === f.experience) &&
    (f.role === "all" || roleMatch[f.role].test(o.title + " " + o.description)),
  ).sort((a, b) => b.match - a.match), [f]);

  const active = Object.values(f).some((v) => v !== "all");
  const labels: Record<keyof typeof f, string> = { role: "Role", location: "Location", skill: "Skill", experience: "Experience", type: "Opportunity type" };

  return (
    <div>
      <PageHeader eyebrow="Discover" title="Opportunities" subtitle="Internships, placements, training, mentorship, events and careers — matched to your Skills Passport." />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(Object.keys(labels) as (keyof typeof f)[]).map((k) => (
          <Select key={k} value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] bg-surface text-sm"><SelectValue placeholder={labels[k]} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All · {labels[k]}</SelectItem>
              {opts[k].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
        {active && <Button variant="ghost" size="sm" onClick={() => setF({ type: "all", location: "all", skill: "all", experience: "all", role: "all" })}><X className="mr-1 h-3.5 w-3.5" /> Clear</Button>}
        <span className="ml-auto font-mono text-xs text-muted-foreground">{list.length} results</span>
      </div>

      {list.length === 0 ? (
        <Panel className="py-12 text-center"><p className="font-medium">No opportunities match these filters.</p><p className="mt-1 text-sm text-muted-foreground">Try widening your location or opportunity type.</p></Panel>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {list.map((o) => {
            const isApplied = applied.includes(o.id);
            return (
              <div key={o.id} className="grid gap-4 border-b p-5 last:border-b-0 transition-colors hover:bg-surface md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><Tag tone="cyan">{o.type}</Tag><span className="font-mono text-xs text-muted-foreground">Closes {o.deadline}</span></div>
                  <p className="mt-2 font-display text-lg font-semibold">{o.title}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">{o.org} · <MapPin className="h-3 w-3" />{o.location} · {o.experience} level</p>
                  <p className="mt-2 text-sm text-muted-foreground">{o.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{o.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>
                </div>
                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <div className="text-right"><p className="font-display text-2xl font-semibold text-gold">{o.match}%</p><p className="eyebrow">Passport match</p></div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleSaveOpp(o.id)} aria-label="Save">{savedOpps.includes(o.id) ? <BookmarkCheck className="h-4 w-4 text-gold" /> : <Bookmark className="h-4 w-4" />}</Button>
                    <Button size="sm" disabled={isApplied} onClick={() => { apply(o.id); toast.success("Application sent with your Skills Passport", { description: `${o.title} · ${o.org}` }); }}>
                      {isApplied ? <><Check className="mr-1 h-3.5 w-3.5" /> Applied</> : o.type === "Mentorship" ? "Request" : o.type === "Industry event" ? "Register" : "Apply with Passport"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
