import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bookmark, BookmarkCheck, CalendarDays, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import nyanzviLogo from "@/assets/nyanzvi-logo.png";
import { Button } from "@/components/ui/button";
import { Panel, Tag } from "@/components/tw/motifs";
import { EventImage } from "@/components/tw/event-image";
import { useAuth } from "@/lib/auth";
import { COMPETENCIES, COURSES } from "@/lib/data";
import { eventDate, eventPlace, fetchEvent, fetchSavedEventIds, toggleSavedEvent } from "@/lib/events";
import { eventsAdminStatus, reviewEvent } from "@/lib/events.functions";

export const Route = createFileRoute("/app/events/$id")({
  head: () => ({ meta: [
    { title: "Event — Tourism Workforce 2031" },
    { name: "description", content: "Event details, official source and related skills." },
    { property: "og:title", content: "Event — Tourism Workforce 2031" },
    { property: "og:description", content: "Event details, official source and related skills." },
    { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const getAdmin = useServerFn(eventsAdminStatus);
  const review = useServerFn(reviewEvent);
  const admin = useQuery({ queryKey: ["events-admin"], queryFn: () => getAdmin(), enabled: !!user }).data?.admin ?? false;
  const q = useQuery({ queryKey: ["event", id], queryFn: () => fetchEvent(id), enabled: !!user });
  const saved = useQuery({ queryKey: ["saved-events", user?.id], queryFn: () => fetchSavedEventIds(user!.id), enabled: !!user });
  const e = q.data;
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading event…</p>;
  if (!e) return <Panel className="p-8 text-center text-sm text-muted-foreground">This event isn't available. <Link to="/app/events" className="text-cyan underline">Back to events</Link></Panel>;

  const isSaved = !!saved.data?.has(e.id);
  const skills = COMPETENCIES.filter((c) => e.related_skills.includes(c.name));
  const courses = COURSES.filter((c) => c.skills.some((s) => e.related_skills.some((r) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase())))).slice(0, 3);
  const nyanzviHref = `/app/ws/intelligence`;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/app/events" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All events</Link>
      <div className="overflow-hidden rounded-2xl border">
        <EventImage src={e.image_url} alt={e.title} className="h-56 w-full md:h-72" />
      </div>
      {e.image_attribution && e.image_url && <p className="mt-1 text-right text-[11px] text-muted-foreground">{e.image_source_url ? <a href={e.image_source_url} target="_blank" rel="noreferrer" className="hover:underline">{e.image_attribution}</a> : e.image_attribution}</p>}

      <div className="mt-5 flex flex-wrap gap-1.5">
        {e.category && <Tag>{e.category}</Tag>}
        <Tag tone={e.is_external ? "default" : "gold"}>{e.is_external ? "External Event" : "Tourism Workforce Event"}</Tag>
        {e.status !== "verified" && <Tag tone="gold">{e.status.replace("_", " ")}</Tag>}
      </div>
      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">{e.title}</h1>
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold" />{eventDate(e)}{e.timezone ? ` · ${e.timezone}` : ""}</p>
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{[e.venue_name, e.venue_address && e.venue_address !== e.venue_name ? e.venue_address : null, eventPlace(e)].filter(Boolean).join(" · ")}</p>
        {e.organiser_name && <p>Organised by <span className="font-medium text-foreground">{e.organiser_name}</span>{e.is_external ? " — not organised by Tourism Workforce" : ""}</p>}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {e.official_url && <Button asChild><a href={e.official_url} target="_blank" rel="noreferrer">Visit Official Event <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a></Button>}
        {e.registration_url && <Button asChild variant="outline"><a href={e.registration_url} target="_blank" rel="noreferrer">Register externally</a></Button>}
        {e.ticket_url && e.ticket_url !== e.registration_url && <Button asChild variant="outline"><a href={e.ticket_url} target="_blank" rel="noreferrer">Tickets</a></Button>}
        <Button variant="outline" onClick={async () => { if (!user) return; await toggleSavedEvent(user.id, e.id, isSaved); qc.invalidateQueries({ queryKey: ["saved-events"] }); toast.success(isSaved ? "Removed from saved events" : "Event saved"); }}>
          {isSaved ? <><BookmarkCheck className="mr-1.5 h-4 w-4 text-gold" /> Saved</> : <><Bookmark className="mr-1.5 h-4 w-4" /> Save Event</>}
        </Button>
        <Button asChild variant="outline"><a href={nyanzviHref}><img src={nyanzviLogo} alt="" className="mr-1.5 h-4 w-4" />Ask Nyanzvi</a></Button>
      </div>

      {e.ai_summary && <Panel className="mt-6 p-5"><p className="eyebrow mb-2">Summary</p><p className="text-sm">{e.ai_summary}</p></Panel>}
      {(e.description || e.source_description) && <Panel className="mt-4 p-5"><p className="eyebrow mb-2">About this event</p><p className="whitespace-pre-line text-sm text-muted-foreground">{e.description ?? e.source_description}</p></Panel>}

      {(skills.length > 0 || courses.length > 0) && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {skills.length > 0 && <Panel className="p-5"><p className="eyebrow mb-3">Related skills</p><div className="space-y-2">{skills.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 text-sm"><span>{s.name}</span><Link to="/app/passport" className="text-xs font-medium text-cyan hover:underline">Develop this skill →</Link></div>
          ))}</div></Panel>}
          {courses.length > 0 && <Panel className="p-5"><p className="eyebrow mb-3">Related learning</p><div className="space-y-2">{courses.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-sm"><span>{c.title}</span><Link to="/app/learning" className="text-xs font-medium text-cyan hover:underline">Start Learning →</Link></div>
          ))}</div></Panel>}
        </div>
      )}

      {e.verification_source_url && (
        <p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-cyan" />Checked against <a href={e.verification_source_url} target="_blank" rel="noreferrer" className="underline">{e.verification_source_name ?? new URL(e.verification_source_url).hostname}</a>{e.last_verified_at ? ` on ${new Date(e.last_verified_at).toLocaleDateString("en-GB")}` : ""}</p>
      )}

      {admin && (
        <Panel className="mt-6 p-4 text-xs text-muted-foreground">
          <p className="eyebrow mb-2">Admin review</p>
          <p>Status: {e.status} · Relevance: {e.relevance_score ?? "—"} {e.tourism_relevance_reason ? `(${e.tourism_relevance_reason})` : ""}</p>
          <p>Source: {e.source} · Image: {e.image_source_type ?? "none"}{e.image_source_name ? ` from ${e.image_source_name}` : ""}</p>
          <div className="mt-3 flex gap-2">
            {(["approve", "reject", "archive"] as const).map((a) => <Button key={a} size="sm" variant="outline" className="capitalize" onClick={async () => { await review({ data: { id: e.id, action: a } }); qc.invalidateQueries({ queryKey: ["event", id] }); toast.success(`Event ${a}d`); }}>{a}</Button>)}
          </div>
        </Panel>
      )}
    </div>
  );
}
