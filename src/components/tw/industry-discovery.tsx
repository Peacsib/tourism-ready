import { useEffect, useState } from "react";
import { Check, ExternalLink, Loader2, Sparkles, UserPlus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { discoverProfessionals, inviteProfessional, type DiscoveredPerson } from "@/lib/discovery.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, Panel, Tag } from "@/components/tw/motifs";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

const PRESETS = ["Hotel Operations", "Travel & Tourism", "Tourism Education", "Tour Operations", "Destination Management", "Hospitality Leadership", "Digital Tourism", "AI in Hospitality", "Sustainable Tourism", "Tourism Entrepreneurship"];
const PRESET_QUERY: Record<string, string> = { "Tourism Education": "Tourism Lecturer", "Tour Operations": "Tour Operator", "Hospitality Leadership": "Hotel General Manager", "Tourism Entrepreneurship": "Tourism Founder", "Travel & Tourism": "Travel Consultant" };
const LEVELS = ["", "Entry", "Manager", "Director", "VP", "C-Level", "Owner"];

function passportMatches(p: DiscoveredPerson, skills: string[]) {
  const text = `${p.headline} ${p.role} ${p.skills.join(" ")}`.toLowerCase();
  return skills.filter((s) => {
    const words = s.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    return words.some((w) => text.includes(w.slice(0, 5)));
  });
}

export function IndustryDiscovery({ query, autoQuery }: { query: string; autoQuery?: string | undefined }) {
  const search = useServerFn(discoverProfessionals);
  const invite = useServerFn(inviteProfessional);
  const { competencies, persona } = useApp();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiscoveredPerson[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState("Zimbabwe");
  const [level, setLevel] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const skills = competencies.map((c) => c.name);
  const run = async (q = query) => {
    if (q.trim().length < 2) { toast.message("Type who you're looking for, or pick a preset below."); return; }
    setLoading(true); setError(null);
    try {
      const r = await search({ data: { query: q.trim(), location, jobLevel: level || undefined } });
      setResults(r.people); setError(r.error ?? null);
    } catch { setResults([]); setError("External discovery is temporarily unavailable. Showing Tourism Workforce members."); }
    finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (autoQuery) run(autoQuery); }, [autoQuery]);
  const doInvite = async (p: DiscoveredPerson) => {
    try {
      const r = await invite({ data: { person: { id: p.id, name: p.name, headline: p.headline, role: p.role, company: p.company, location: p.location, profileUrl: p.profileUrl }, invitedBy: persona.name } });
      if (!r.ok) throw new Error();
      setInvited((v) => [...v, p.id]); toast.success(`Invitation to ${p.name} recorded`);
    } catch { toast.error("Couldn't save the invitation. Try again."); }
  };
  return (
    <Panel className="mb-5 mt-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="eyebrow text-cyan">Industry discovery</p>
          <p className="mt-1 text-sm text-muted-foreground">Find real tourism professionals beyond the platform, matching your search.</p>
        </div>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-surface sm:w-36" placeholder="Country" maxLength={80} />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-9 rounded-md border bg-surface px-2 text-sm" aria-label="Seniority">
          {LEVELS.map((l) => <option key={l} value={l}>{l || "Any seniority"}</option>)}
        </select>
        <Button size="sm" onClick={() => run()} disabled={loading}>{loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />} Discover</Button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((p) => <button key={p} onClick={() => run(PRESET_QUERY[p] ?? p)} className="shrink-0 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-cyan/50 hover:text-foreground">{p}</button>)}
      </div>
      {error && <p className="mt-3 text-sm text-muted-foreground">{error}</p>}
      {results && results.length === 0 && !error && <p className="mt-3 text-sm text-muted-foreground">No industry matches. Try a broader role or location.</p>}
      {results && results.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {results.map((p) => {
            const matches = passportMatches(p, skills);
            return (
              <div key={p.id} className="lift flex flex-col rounded-2xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  {p.photoUrl ? <img src={p.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <Avatar initials={p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    {p.headline && <p className="line-clamp-2 text-sm text-muted-foreground">{p.headline}</p>}
                    <p className="font-mono text-xs text-muted-foreground">{[p.role, p.company, p.location].filter(Boolean).join(" · ")}</p>
                  </div>
                  <Tag tone="cyan">External Professional</Tag>
                </div>
                {p.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{p.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>}
                {(p.jobLevel || p.jobFunction || p.industry) && <p className="mt-3 text-xs text-muted-foreground">{[p.jobLevel, p.jobFunction, p.industry].filter(Boolean).join(" · ")}</p>}
                {matches.length > 0 && (
                  <div className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs">
                    <span className="font-medium text-gold">Relevant to your Skills Passport</span>
                    <span className="text-muted-foreground"> · {matches.join(", ")}</span>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.profileUrl && <Button size="sm" variant="outline" asChild><a href={p.profileUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-3.5 w-3.5" /> View Professional</a></Button>}
                  {invited.includes(p.id)
                    ? <Button size="sm" variant="outline" disabled><Check className="mr-1 h-3.5 w-3.5" /> Invited</Button>
                    : <Button size="sm" onClick={() => doInvite(p)}><UserPlus className="mr-1 h-3.5 w-3.5" /> Invite to Tourism Workforce</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
