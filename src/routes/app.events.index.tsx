import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Bookmark, BookmarkCheck, CalendarDays, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Tag } from "@/components/tw/motifs";
import { EventImage } from "@/components/tw/event-image";
import { useAuth } from "@/lib/auth";
import { eventDate, eventPlace, fetchEvents, fetchSavedEventIds, toggleSavedEvent } from "@/lib/events";
import { eventsAdminStatus, refreshEvents, reviewEvent } from "@/lib/events.functions";

export const Route = createFileRoute("/app/events/")({
  head: () => ({ meta: [
    { title: "Events — Tourism Workforce 2031" },
    { name: "description", content: "Verified tourism, hospitality and travel events across Zimbabwe, Southern Africa and beyond." },
    { property: "og:title", content: "Events — Tourism Workforce 2031" },
    { property: "og:description", content: "Verified tourism and hospitality events for Zimbabwe's workforce." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: EventsPage,
});

function EventsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const getAdmin = useServerFn(eventsAdminStatus);
  const refresh = useServerFn(refreshEvents);
  const review = useServerFn(reviewEvent);
  const admin = useQuery({ queryKey: ["events-admin"], queryFn: () => getAdmin(), enabled: !!user }).data?.admin ?? false;
  const events = useQuery({ queryKey: ["events", admin], queryFn: () => fetchEvents({ admin }), enabled: !!user });
  const saved = useQuery({ queryKey: ["saved-events", user?.id], queryFn: () => fetchSavedEventIds(user!.id), enabled: !!user });
  const [tab, setTab] = useState<"upcoming" | "saved" | "past" | "review">("upcoming");
  const [running, setRunning] = useState(false);

  const all = events.data ?? [];
  const now = Date.now();
  const isPast = (e: (typeof all)[number]) => e.status === "past" || (!!e.start_datetime && new Date(e.end_datetime ?? e.start_datetime).getTime() < now - 86400000);
  const list = tab === "review" ? all.filter((e) => ["candidate", "needs_review"].includes(e.status))
    : tab === "past" ? all.filter((e) => isPast(e) && e.status !== "archived" && e.status !== "rejected")
    : tab === "saved" ? all.filter((e) => saved.data?.has(e.id))
    : all.filter((e) => ["verified", "postponed", "cancelled"].includes(e.status) && !isPast(e));

  const doRefresh = async () => {
    setRunning(true);
    try {
      const r = await refresh();
      if (!r.ok) toast.error(r.error);
      else {
        const x = r.report;
        toast.success("Events refreshed", { description: `${x.queries_run} searches · ${x.candidates_found} found · ${x.duplicates_removed} duplicates · ${x.verified_count} verified · ${x.rejected_count} rejected · ${x.updated_count} updated · ${x.images_found} images (${x.images_failed} failed)${x.errors.length ? ` · ${x.errors.length} errors` : ""}`, duration: 12000 });
        if (x.errors.length) console.warn("Event refresh errors", x.errors);
      }
      qc.invalidateQueries({ queryKey: ["events"] });
    } catch (e) { toast.error((e as Error).message); } finally { setRunning(false); }
  };

  const save = async (id: string) => {
    if (!user) return;
    const has = !!saved.data?.has(id);
    await toggleSavedEvent(user.id, id, has);
    qc.invalidateQueries({ queryKey: ["saved-events"] });
    toast.success(has ? "Removed from saved events" : "Event saved");
  };

  return (
    <div>
      <PageHeader eyebrow="Connect" title="Events" subtitle="Real tourism, hospitality and travel events — Zimbabwe first, then Southern Africa, Africa and the world. Each one is checked against its official source." />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["upcoming", "saved", "past", ...(admin ? ["review"] as const : [])] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} className="capitalize">{t === "review" ? "Needs review" : t}</Button>
        ))}
        {admin && <Button size="sm" variant="outline" className="ml-auto" disabled={running} onClick={doRefresh}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />{running ? "Refreshing… (can take a few minutes)" : "Refresh Events"}</Button>}
      </div>

      {events.isLoading ? <p className="text-sm text-muted-foreground">Loading events…</p>
      : list.length === 0 ? <Panel className="p-8 text-center text-sm text-muted-foreground">{tab === "saved" ? "You haven't saved any events yet." : tab === "past" ? "No past events yet." : tab === "review" ? "Nothing waiting for review." : "No upcoming events have been verified yet."}</Panel>
      : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <Panel key={e.id} className="flex flex-col overflow-hidden p-0">
              <Link to="/app/events/$id" params={{ id: e.id }} className="block">
                <EventImage src={e.image_url} alt={e.title} className="h-40 w-full" />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {e.category && <Tag>{e.category}</Tag>}
                  <Tag tone={e.is_external ? "default" : "gold"}>{e.is_external ? "External Event" : "Tourism Workforce Event"}</Tag>
                  {(e.status === "cancelled" || e.status === "postponed" || tab === "review") && <Tag tone="gold">{e.status.replace("_", " ")}</Tag>}
                </div>
                <Link to="/app/events/$id" params={{ id: e.id }} className="font-display text-lg font-semibold leading-snug hover:underline">{e.title}</Link>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5 text-gold" />{eventDate(e)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-gold" />{[e.venue_name, eventPlace(e)].filter(Boolean).join(" · ")}</p>
                {(e.ai_summary || e.source_description) && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{e.ai_summary ?? e.source_description}</p>}
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <Button asChild size="sm"><Link to="/app/events/$id" params={{ id: e.id }}>View Event</Link></Button>
                  <Button size="icon" variant="ghost" aria-label="Save event" onClick={() => save(e.id)}>{saved.data?.has(e.id) ? <BookmarkCheck className="h-4 w-4 text-gold" /> : <Bookmark className="h-4 w-4" />}</Button>
                  {tab === "review" && <>
                    <Button size="sm" variant="outline" onClick={async () => { await review({ data: { id: e.id, action: "approve" } }); qc.invalidateQueries({ queryKey: ["events"] }); }}>Approve</Button>
                    <Button size="sm" variant="ghost" onClick={async () => { await review({ data: { id: e.id, action: "reject" } }); qc.invalidateQueries({ queryKey: ["events"] }); }}>Reject</Button>
                  </>}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
