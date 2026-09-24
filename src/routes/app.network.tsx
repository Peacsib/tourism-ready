import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Image as ImageIcon, Linkedin, Loader2, Mic, MessageSquare, Search, Square, Users, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/components/tw/member-avatar";
import { PostCard } from "@/components/tw/post-card";
import { ConnectButton, useMyConnections } from "@/components/tw/connect-button";
import { IndustryDiscovery } from "@/components/tw/industry-discovery";
import { importLinkedInProfile, linkedinStatus, shareToLinkedIn } from "@/lib/linkedin.functions";
import { createPost, displayName, fetchFeed, fetchMembers, markLinkedInShared, ROLE_LABEL, type FeedPost, type Member } from "@/lib/social";
import { useVoiceInput } from "@/lib/voice";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import nyanzviLogo from "@/assets/nyanzvi-logo.png";

export const Route = createFileRoute("/app/network")({
  head: () => ({ meta: [
    { title: "Tourism Network — Tourism Workforce 2031" },
    { name: "description", content: "The professional network for Zimbabwe's tourism and hospitality workforce." },
    { property: "og:title", content: "Tourism Network — Tourism Workforce 2031" },
    { property: "og:description", content: "The professional network for Zimbabwe's tourism and hospitality workforce." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: NetworkPage,
});

function NetworkPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { competencies } = useApp();
  const net = useMyConnections();
  const [feed, setFeed] = useState<FeedPost[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [liEnabled, setLiEnabled] = useState(false);
  const liStatus = useServerFn(linkedinStatus);
  const liImport = useServerFn(importLinkedInProfile);
  const [importing, setImporting] = useState(false);

  const loadFeed = useCallback(async () => { try { setFeed(await fetchFeed()); } catch (e) { toast.error((e as Error).message); setFeed([]); } }, []);
  useEffect(() => { loadFeed(); }, [loadFeed]);
  useEffect(() => { liStatus().then((r) => setLiEnabled(r.enabled)).catch(() => {}); }, [liStatus]);
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => { fetchMembers(user.id, q).then(setMembers).catch(() => setMembers([])); }, 250);
    return () => clearTimeout(t);
  }, [user, q]);

  if (!user) return null;
  const connected = net.conns.filter((c) => c.status === "accepted").length;
  const invites = net.conns.filter((c) => c.status === "pending" && c.addressee_id === user.id).length;
  const verified = competencies.filter((c) => c.state === "Verified").length;
  const suggestions = members.filter((m) => net.statusWith(m.id) !== "connected").slice(0, 6);

  const doImport = async () => {
    setImporting(true);
    try { const r = await liImport(); if (!r.ok) throw new Error(r.error); await refreshProfile(); toast.success("Profile updated from LinkedIn"); }
    catch (e) { toast.error((e as Error).message); } finally { setImporting(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_300px]">
      {/* Left: identity */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="h-16 bg-gradient-to-r from-cyan/30 via-primary/20 to-gold/30" />
          <div className="-mt-8 px-5 pb-5">
            <MemberAvatar m={profile} size="lg" className="border-4 border-card" />
            <Link to="/app/profile" className="mt-2 block font-display text-lg font-semibold hover:underline">{profile?.full_name || "Your profile"}</Link>
            <p className="text-sm text-muted-foreground">{profile?.headline || ROLE_LABEL[profile?.role ?? ""] || "Add a headline"}</p>
            {profile?.location && <p className="mt-1 text-xs text-muted-foreground">{profile.location}</p>}
          </div>
          <div className="divide-y border-t text-sm">
            <Link to="/app/my-network" className="flex justify-between px-5 py-2.5 hover:bg-accent"><span className="text-muted-foreground">Connections</span><span className="font-semibold">{connected}</span></Link>
            <Link to="/app/my-network" className="flex justify-between px-5 py-2.5 hover:bg-accent"><span className="text-muted-foreground">Invitations</span><span className={cn("font-semibold", invites && "text-gold")}>{invites}</span></Link>
            <Link to="/app/passport" className="flex justify-between px-5 py-2.5 hover:bg-accent"><span className="text-muted-foreground">Verified skills</span><span className="font-semibold">{verified}</span></Link>
          </div>
        </div>
        <div className="space-y-1 rounded-2xl border bg-card p-2 text-sm shadow-sm">
          <Link to="/app/my-network" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"><Users className="h-4 w-4 text-cyan" /> My network</Link>
          <Link to="/app/messages" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"><MessageSquare className="h-4 w-4 text-cyan" /> Messages</Link>
          <Link to="/app/ws/$module" params={{ module: "network" }} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"><img src={nyanzviLogo} alt="" className="h-4 w-4" /> Ask Nyanzvi Connect</Link>
          {liEnabled && (
            <button onClick={doImport} disabled={importing} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-accent">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4 text-cyan" />} Import from LinkedIn
            </button>
          )}
        </div>
      </aside>

      {/* Middle: feed */}
      <main className="min-w-0 space-y-4">
        <Composer liEnabled={liEnabled} onPosted={loadFeed} />
        {feed === null ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : feed.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-center">
            <p className="font-display text-lg font-semibold">Start the conversation</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">No member has posted yet. Share a win from your shift, a question for managers, or a tip for newcomers. Meanwhile, here are real tourism professionals in Zimbabwe you can invite.</p>
          </div>
        ) : feed.map((p) => <PostCard key={p.id} post={p} me={user.id} net={net} onChange={loadFeed} />)}
      </main>

      {/* Right: people */}
      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" className="bg-surface pl-9" /></div>
          <p className="eyebrow mt-4">People you may know</p>
          <ul className="mt-3 space-y-3">
            {suggestions.length === 0 && <li className="text-sm text-muted-foreground">{q ? "No members match that search." : "You're connected with every member so far. Invite professionals from Industry discovery."}</li>}
            {suggestions.map((m) => (
              <li key={m.id} className="flex items-start gap-3">
                <Link to="/app/people/$id" params={{ id: m.id }}><MemberAvatar m={m} size="sm" /></Link>
                <div className="min-w-0 flex-1">
                  <Link to="/app/people/$id" params={{ id: m.id }} className="block truncate text-sm font-medium hover:underline">{displayName(m)}</Link>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{m.headline || ROLE_LABEL[m.role] || "Member"}</p>
                  <div className="mt-1.5"><ConnectButton personId={m.id} name={displayName(m)} net={net} /></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="lg:col-span-2 xl:col-span-3">
        {feed !== null && <IndustryDiscovery query={q} autoQuery={feed.length === 0 ? "Hotel Manager" : undefined} />}
      </div>
    </div>
  );
}

function Composer({ liEnabled, onPosted }: { liEnabled: boolean; onPosted: () => void }) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [toLinkedIn, setToLinkedIn] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef(text); textRef.current = text;
  const voice = useVoiceInput(() => textRef.current, setText, (m) => toast.error(m));
  const share = useServerFn(shareToLinkedIn);

  const pick = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Choose a photo."); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Photos must be under 5 MB."); return; }
    setPhoto(f); setPreview(URL.createObjectURL(f));
  };
  const clearPhoto = () => { setPhoto(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const submit = async () => {
    if (!user || (!text.trim() && !photo)) return;
    voice.stopAll();
    setPosting(true);
    try {
      const id = await createPost(user.id, text.trim(), photo);
      if (toLinkedIn && liEnabled && text.trim()) {
        const r = await share({ data: { text: text.trim() } });
        if (r.ok) { await markLinkedInShared(id); toast.success("Posted here and on LinkedIn"); } else toast.error(r.error);
      } else toast.success("Posted to the Tourism Network");
      setText(""); clearPhoto(); onPosted();
    } catch (e) { toast.error((e as Error).message); } finally { setPosting(false); }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <MemberAvatar m={profile} />
        <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} placeholder="Share an insight, a win or a question with tourism professionals…" className="min-h-[72px] flex-1 resize-none border-0 bg-surface/60 focus-visible:ring-1" />
      </div>
      {preview && (
        <div className="relative mt-3 ml-14">
          <img src={preview} alt="" className="max-h-64 rounded-xl border object-cover" />
          <button onClick={clearPhoto} aria-label="Remove photo" className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"><X className="h-4 w-4" /></button>
        </div>
      )}
      {(voice.listening || voice.recording || voice.transcribing) && (
        <p className="ml-14 mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("h-2 w-2 rounded-full", voice.transcribing ? "bg-cyan" : "animate-pulse bg-destructive")} />
          {voice.listening ? "Listening… speak and your words appear above" : voice.recording ? "Recording… tap stop when done" : "Turning your voice note into text…"}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1 border-t pt-3">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}><ImageIcon className="mr-1.5 h-4 w-4 text-cyan" /> Photo</Button>
        <Button type="button" variant="ghost" size="sm" onClick={voice.toggleSpeech} disabled={voice.recording} className={cn(voice.listening && "text-destructive")}><Mic className="mr-1.5 h-4 w-4 text-gold" /> {voice.listening ? "Stop" : "Speak"}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={voice.toggleRecording} disabled={voice.listening || voice.transcribing} className={cn(voice.recording && "text-destructive")}>
          {voice.transcribing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : voice.recording ? <Square className="mr-1.5 h-4 w-4" /> : <AudioLines className="mr-1.5 h-4 w-4 text-gold" />} Voice note
        </Button>
        {liEnabled && (
          <label className="ml-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={toLinkedIn} onChange={(e) => setToLinkedIn(e.target.checked)} className="accent-[var(--color-gold)]" />
            <Linkedin className="h-3.5 w-3.5" /> Also post to LinkedIn
          </label>
        )}
        <Button className="ml-auto" size="sm" onClick={submit} disabled={posting || (!text.trim() && !photo)}>{posting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />} Post</Button>
      </div>
    </div>
  );
}
