import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Loader2, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/tw/member-avatar";
import { ConnectButton, useMyConnections } from "@/components/tw/connect-button";
import { PostCard } from "@/components/tw/post-card";
import { Tag } from "@/components/tw/motifs";
import { supabase } from "@/integrations/supabase/client";
import { countConnections, displayName, fetchFeed, fetchMember, ROLE_LABEL, type FeedPost, type Member } from "@/lib/social";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/people/$id")({
  head: () => ({ meta: [
    { title: "Member profile — Tourism Network" },
    { name: "description", content: "Professional profile and verified skills on the Tourism Network." },
    { property: "og:title", content: "Member profile — Tourism Network" },
    { property: "og:description", content: "Professional profile and verified skills on the Tourism Network." },
    { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: PersonPage,
});

type Skill = { competency_id: string; name: string; state: string; level: number; category: string };

function PersonPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const net = useMyConnections();
  const [m, setM] = useState<Member | null | undefined>(undefined);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const [member, sk, ps, c] = await Promise.all([
      fetchMember(id).catch(() => null),
      supabase.from("user_competencies").select("competency_id, name, state, level, category").eq("user_id", id).order("level", { ascending: false }),
      fetchFeed(id).catch(() => []),
      countConnections(id),
    ]);
    setM(member); setSkills((sk.data ?? []) as Skill[]); setPosts(ps); setCount(c);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (m === undefined) return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (m === null) return <div className="py-20 text-center"><h1 className="text-2xl font-semibold">Profile not found</h1><Button asChild className="mt-6"><Link to="/app/network">Back to network</Link></Button></div>;

  const strong = skills.filter((s) => s.state === "Verified" || s.state === "Demonstrated");
  const isMe = user?.id === m.id;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground"><Link to="/app/network"><ArrowLeft className="mr-1 h-4 w-4" /> Network</Link></Button>
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="h-28 bg-gradient-to-r from-cyan/30 via-primary/20 to-gold/30" />
        <div className="-mt-12 px-6 pb-6">
          <MemberAvatar m={m} size="xl" className="border-4 border-card" />
          <h1 className="mt-3 font-display text-2xl font-semibold">{displayName(m)}</h1>
          <p className="text-muted-foreground">{m.headline || ROLE_LABEL[m.role] || "Member"}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            {m.organisation && <span>{m.organisation}</span>}
            {m.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>}
            <Link to="/app/my-network" className="font-medium text-cyan hover:underline">{count} connection{count === 1 ? "" : "s"}</Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {isMe ? <Button asChild variant="outline"><Link to="/app/profile">Edit profile</Link></Button> : <>
              <ConnectButton personId={m.id} name={displayName(m)} net={net} size="default" />
              <Button asChild variant="outline"><Link to="/app/messages" search={{ to: m.id }}><MessageSquare className="mr-1 h-4 w-4" /> Message</Link></Button>
            </>}
          </div>
        </div>
      </section>

      {(m.bio || m.goal) && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="eyebrow">About</p>
          {m.bio && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{m.bio}</p>}
          {m.goal && <p className="mt-3 text-sm"><span className="text-muted-foreground">Career goal: </span>{m.goal}</p>}
        </section>
      )}

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between"><p className="eyebrow">Skills Passport</p><span className="text-xs text-muted-foreground">{strong.length} demonstrated or verified</span></div>
        {skills.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No skills recorded yet.</p> : (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.slice(0, 16).map((s) => (
              <span key={s.competency_id} className="flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 text-xs">
                {s.state === "Verified" && <BadgeCheck className="h-3.5 w-3.5 text-gold" />}{s.name}<span className="text-muted-foreground">· {s.state}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <p className="eyebrow px-1">Activity</p>
        {posts.length === 0 ? <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">{isMe ? "You haven't posted yet." : `${displayName(m)} hasn't posted yet.`}</p>
          : posts.map((p) => <PostCard key={p.id} post={p} me={user?.id ?? ""} net={net} onChange={load} />)}
      </section>
      <div className="hidden"><Tag>{m.role}</Tag></div>
    </div>
  );
}
