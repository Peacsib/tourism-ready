import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, BookmarkCheck, Check, Clock, ExternalLink, Heart, Loader2, MessageCircle, MessageSquare, Search, Sparkles, UserPlus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { discoverProfessionals, inviteProfessional, type DiscoveredPerson } from "@/lib/discovery.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, PageHeader, Panel, Tag } from "@/components/tw/motifs";
import { MessageDialog } from "@/components/tw/message-dialog";
import { PEOPLE, type Person } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/network")({
  head: () => ({ meta: [{ title: "Tourism Network — Tourism Workforce 2031" }, { name: "description", content: "Connect the people shaping Zimbabwe's tourism future." }] }),
  component: NetworkPage,
});

const TYPES = ["All", "Student", "Graduate", "Tourism Professional", "Hotel Manager", "Travel Agent", "Educator", "Entrepreneur", "Industry Organisation"];

export function ConnectButton({ person, size = "sm" }: { person: Person; size?: "sm" | "default" }) {
  const { connections, pending, connect } = useApp();
  if (connections.includes(person.id)) return <Button size={size} variant="outline" disabled><Check className="mr-1 h-3.5 w-3.5" /> Connected</Button>;
  if (pending.includes(person.id)) return <Button size={size} variant="outline" disabled><Clock className="mr-1 h-3.5 w-3.5" /> Pending</Button>;
  return <Button size={size} onClick={() => { connect(person.id); toast.success(`Connection request sent to ${person.name}`); }}><UserPlus className="mr-1 h-3.5 w-3.5" /> Connect</Button>;
}

function NetworkPage() {
  const { posts, reacted, savedPosts, toggleReact, toggleSavePost, addComment, addPost, persona } = useApp();
  const [type, setType] = useState("All");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [msgTo, setMsgTo] = useState<Person | null>(null);
  const people = PEOPLE.filter((p) => (type === "All" || p.type === type) && `${p.name} ${p.role} ${p.organisation} ${p.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader eyebrow="Connect" title="Tourism Network" subtitle="Connect the people shaping Zimbabwe's tourism future." />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, organisations, skills" className="bg-surface pl-9" /></div>
          </div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {TYPES.map((t) => <button key={t} onClick={() => setType(t)} className={cn("shrink-0 rounded-full border px-3 py-1 text-xs transition-colors", type === t ? "border-gold/50 bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground")}>{t}</button>)}
          </div>
          {people.length === 0 && <Panel className="text-center text-sm text-muted-foreground">No one matches that search yet. Try a skill like "Reservations".</Panel>}
          <IndustryDiscovery query={q} />
          <div className="grid gap-3 md:grid-cols-2">
            {people.map((p) => (
              <div key={p.id} className="lift flex flex-col rounded-2xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <Avatar initials={p.initials} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{p.role} · {p.organisation}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.location} · {p.experience}</p>
                  </div>
                  <Tag>{p.type}</Tag>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">{p.skills.map((s) => <Tag key={s} tone="cyan">{s}</Tag>)}</div>
                <p className="mt-3 text-xs text-muted-foreground">Interests: {p.interests.join(", ")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ConnectButton person={p} />
                  <Button size="sm" variant="outline" asChild><Link to="/app/people/$id" params={{ id: p.id }}>View profile</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => setMsgTo(p)}><MessageSquare className="mr-1 h-3.5 w-3.5" /> Message</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Panel>
            <form onSubmit={(e) => { e.preventDefault(); if (draft.trim().length < 3) return; addPost(draft.trim()); setDraft(""); toast.success("Shared with your network"); }}>
              <div className="flex gap-3"><Avatar initials={persona.initials} size="sm" tone="gold" /><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Share an industry insight…" className="min-h-20 bg-surface" maxLength={600} /></div>
              <div className="mt-3 flex justify-end"><Button size="sm" type="submit" disabled={draft.trim().length < 3}>Post</Button></div>
            </form>
          </Panel>
          <p className="eyebrow px-1">Professional feed</p>
          {posts.map((post) => {
            const author = PEOPLE.find((p) => p.id === post.authorId);
            const name = author?.name ?? persona.name;
            const initials = author?.initials ?? persona.initials;
            return (
              <Panel key={post.id} className="p-5 md:p-5">
                <div className="flex items-center gap-3">
                  <Avatar initials={initials} size="sm" tone={author ? "default" : "gold"} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{author?.role ?? persona.title} · {post.time}</p></div>
                  <Tag tone="gold">{post.label}</Tag>
                </div>
                <p className="mt-4 text-sm leading-relaxed">{post.body}</p>
                <div className="mt-4 flex items-center gap-1 border-t pt-3 text-muted-foreground">
                  <Button variant="ghost" size="sm" onClick={() => toggleReact(post.id)} className={cn(reacted.includes(post.id) && "text-gold")}><Heart className={cn("mr-1 h-4 w-4", reacted.includes(post.id) && "fill-current")} /> {post.reactions}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setOpenComments(openComments === post.id ? null : post.id)}><MessageCircle className="mr-1 h-4 w-4" /> {post.comments.length}</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleSavePost(post.id)} aria-label="Save">{savedPosts.includes(post.id) ? <BookmarkCheck className="h-4 w-4 text-gold" /> : <Bookmark className="h-4 w-4" />}</Button>
                  {author && <span className="ml-auto"><ConnectButton person={author} /></span>}
                </div>
                {openComments === post.id && (
                  <div className="fade-up mt-3 space-y-3">
                    {post.comments.map((c, i) => <div key={i} className="rounded-xl bg-surface-2/60 px-3 py-2 text-sm"><span className="font-medium">{c.author}</span> <span className="text-muted-foreground">{c.text}</span></div>)}
                    <form onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; addComment(post.id, comment.trim()); setComment(""); }} className="flex gap-2">
                      <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" className="bg-surface" maxLength={300} />
                      <Button size="sm" type="submit" disabled={!comment.trim()}>Reply</Button>
                    </form>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
      <MessageDialog person={msgTo} onClose={() => setMsgTo(null)} />
    </div>
  );
}

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

function IndustryDiscovery({ query }: { query: string }) {
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
