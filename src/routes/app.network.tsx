import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Briefcase,
  ExternalLink,
  Image as ImageIcon,
  Linkedin,
  Loader2,
  Mic,
  MessageSquare,
  Search,
  Sparkles,
  Square,
  UserCheck,
  UserPlus,
  Users,
  X
} from "lucide-react";
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
import {
  createPost,
  displayName,
  fetchFeed,
  fetchMembers,
  markLinkedInShared,
  ROLE_LABEL,
  type FeedPost,
  type Member
} from "@/lib/social";
import { useVoiceInput } from "@/lib/voice";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import nyanzviLogo from "@/assets/nyanzvi-logo.png";

export const Route = createFileRoute("/app/network")({
  head: () => ({
    meta: [
      { title: "Tourism Network — Tourism Workforce 2031" },
      { name: "description", content: "The professional network for Zimbabwe's tourism and hospitality workforce." },
      { property: "og:title", content: "Tourism Network — Tourism Workforce 2031" },
      { property: "og:description", content: "The professional network for Zimbabwe's tourism and hospitality workforce." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ]
  }),
  component: NetworkPage,
});

type ExternalPro = {
  id: string;
  name: string;
  headline: string | null;
  role: string | null;
  company: string | null;
  location: string | null;
  profile_url: string | null;
};

function NetworkPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { competencies } = useApp();
  const net = useMyConnections();

  const [currentTab, setCurrentTab] = useState<"feed" | "discovery" | "my-network">("feed");
  const [feed, setFeed] = useState<FeedPost[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [externalPros, setExternalPros] = useState<ExternalPro[]>([]);
  const [q, setQ] = useState("");
  const [liEnabled, setLiEnabled] = useState(false);
  const [importing, setImporting] = useState(false);

  const liStatus = useServerFn(linkedinStatus);
  const liImport = useServerFn(importLinkedInProfile);

  const loadFeed = useCallback(async () => {
    try {
      setFeed(await fetchFeed());
    } catch (e) {
      toast.error((e as Error).message);
      setFeed([]);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    liStatus()
      .then((r) => setLiEnabled(r.enabled))
      .catch(() => {});
  }, [liStatus]);

  // Search members
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      fetchMembers(user.id, q)
        .then(setMembers)
        .catch(() => setMembers([]));
    }, 250);
    return () => clearTimeout(t);
  }, [user, q]);

  // Load real Zimbabwean hospitality leaders
  useEffect(() => {
    supabase
      .from("external_professionals")
      .select("id, name, headline, role, company, location, profile_url")
      .limit(6)
      .then(({ data }) => {
        if (data) setExternalPros(data as ExternalPro[]);
      });
  }, []);

  if (!user) return null;

  const connected = net.conns.filter((c) => c.status === "accepted").length;
  const invites = net.conns.filter((c) => c.status === "pending" && c.addressee_id === user.id).length;
  const verified = competencies.filter((c) => c.state === "Verified").length;
  const suggestions = members.filter((m) => net.statusWith(m.id) !== "connected").slice(0, 5);

  const doImport = async () => {
    setImporting(true);
    try {
      const r = await liImport();
      if (!r.ok) throw new Error(r.error);
      await refreshProfile();
      toast.success("Profile updated from LinkedIn");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Clean Header & View Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Tourism Network</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold">
              ● Zimbabwe
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Connect with verified hospitality leaders, lodge managers, and tourism peers across Zimbabwe.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="inline-flex rounded-xl bg-surface-2 p-1 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setCurrentTab("feed")}
            className={cn(
              "rounded-lg px-3.5 py-1.5 transition-all",
              currentTab === "feed" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Community Feed
          </button>
          <button
            onClick={() => setCurrentTab("discovery")}
            className={cn(
              "rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5",
              currentTab === "discovery" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="h-3 w-3 text-cyan" /> Industry Discovery
          </button>
          <Link
            to="/app/my-network"
            className="rounded-lg px-3.5 py-1.5 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1"
          >
            My Network <span className="font-mono text-[10px] text-gold font-bold">({connected})</span>
          </Link>
        </div>
      </div>

      {/* Main Grid Layout */}
      {currentTab === "discovery" ? (
        <div className="space-y-6">
          <IndustryDiscovery query={q} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          {/* LEFT: Compact Profile & Navigation */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="h-16 bg-gradient-to-r from-cyan/30 via-primary/20 to-gold/30" />
              <div className="-mt-7 px-4 pb-4">
                <MemberAvatar m={profile} size="lg" className="border-3 border-card ring-1 ring-border shadow-xs" />
                <Link to="/app/profile" className="mt-2 block font-display text-base font-semibold hover:underline truncate">
                  {profile?.full_name || "Your Profile"}
                </Link>
                <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">
                  {profile?.headline || ROLE_LABEL[profile?.role ?? ""] || "Tourism Workforce Member"}
                </p>
                {profile?.location && (
                  <p className="mt-1 text-[11px] text-muted-foreground/80 font-mono">{profile.location}</p>
                )}
              </div>

              <div className="divide-y border-t text-xs">
                <Link to="/app/my-network" className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/60 transition-colors">
                  <span className="text-muted-foreground">Connections</span>
                  <span className="font-semibold font-mono">{connected}</span>
                </Link>
                <Link to="/app/my-network" className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/60 transition-colors">
                  <span className="text-muted-foreground">Invitations</span>
                  <span className={cn("font-semibold font-mono", invites > 0 && "text-gold")}>{invites}</span>
                </Link>
                <Link to="/app/passport" className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/60 transition-colors">
                  <span className="text-muted-foreground">Skills Passport</span>
                  <span className="font-semibold font-mono text-cyan">{verified}</span>
                </Link>
              </div>
            </div>

            {/* Quick shortcuts */}
            <div className="rounded-2xl border bg-card p-2 text-xs shadow-xs space-y-0.5">
              <Link to="/app/my-network" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Users className="h-3.5 w-3.5 text-cyan" /> My Connections
              </Link>
              <Link to="/app/messages" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <MessageSquare className="h-3.5 w-3.5 text-cyan" /> Direct Messages
              </Link>
              <Link to="/app/ws/$module" params={{ module: "network" }} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <img src={nyanzviLogo} alt="" className="h-3.5 w-3.5" /> Ask Nyanzvi Connect
              </Link>
              {liEnabled && (
                <button
                  onClick={doImport}
                  disabled={importing}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Linkedin className="h-3.5 w-3.5 text-cyan" />} Sync LinkedIn
                </button>
              )}
            </div>
          </aside>

          {/* MIDDLE: Modern Stream Feed */}
          <main className="min-w-0 space-y-4">
            <Composer liEnabled={liEnabled} onPosted={loadFeed} />

            {feed === null ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : feed.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card/60 p-8 text-center">
                <p className="font-display text-base font-semibold">Start the conversation</p>
                <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                  No member has posted yet. Share a shift win, an inquiry for hotel managers, or an industry observation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feed.map((p) => (
                  <PostCard key={p.id} post={p} me={user.id} net={net} onChange={loadFeed} />
                ))}
              </div>
            )}
          </main>

          {/* RIGHT: Network Intelligence & Real Industry Figures */}
          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            {/* Search Box */}
            <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search members or roles"
                  className="bg-surface pl-8 h-9 text-xs rounded-xl"
                />
              </div>

              {/* Members you may know */}
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  People you may know
                </p>
                <ul className="mt-3 space-y-3">
                  {suggestions.length === 0 && (
                    <li className="text-xs text-muted-foreground">
                      {q ? "No members match that search." : "Connected with all active members."}
                    </li>
                  )}
                  {suggestions.map((m) => (
                    <li key={m.id} className="flex items-start gap-2.5">
                      <Link to="/app/people/$id" params={{ id: m.id }}>
                        <MemberAvatar m={m} size="sm" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to="/app/people/$id" params={{ id: m.id }} className="block truncate text-xs font-semibold hover:underline">
                          {displayName(m)}
                        </Link>
                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                          {m.headline || ROLE_LABEL[m.role] || "Member"}
                        </p>
                        <div className="mt-1">
                          <ConnectButton personId={m.id} name={displayName(m)} net={net} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Verified Tourism Leaders in Zimbabwe */}
              {externalPros.length > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono uppercase tracking-wider text-cyan font-semibold">
                      Zimbabwe Industry Leaders
                    </p>
                    <button
                      onClick={() => setCurrentTab("discovery")}
                      className="text-[11px] text-cyan hover:underline font-medium"
                    >
                      View all →
                    </button>
                  </div>
                  <ul className="mt-3 space-y-3">
                    {externalPros.slice(0, 4).map((p) => (
                      <li key={p.id} className="flex items-start gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-cyan/10 text-cyan flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{p.name}</p>
                          <p className="line-clamp-1 text-[11px] text-muted-foreground">{p.headline || p.role || "Hotel Leader"}</p>
                          {p.location && (
                            <p className="text-[10px] text-muted-foreground/70 font-mono truncate">{p.location}</p>
                          )}
                          <div className="mt-1">
                            {p.profile_url ? (
                              <Button asChild size="sm" variant="outline" className="h-6 text-[10px] px-2 rounded-lg">
                                <a href={p.profile_url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="mr-1 h-2.5 w-2.5" /> Profile
                                </a>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.success(`Invitation to ${p.name} recorded`)}
                                className="h-6 text-[10px] px-2 rounded-lg"
                              >
                                <UserPlus className="mr-1 h-2.5 w-2.5" /> Invite
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
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
  const textRef = useRef(text);
  textRef.current = text;
  const voice = useVoiceInput(
    () => textRef.current,
    setText,
    (m) => toast.error(m)
  );
  const share = useServerFn(shareToLinkedIn);

  const pick = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Choose a photo.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Photos must be under 5 MB.");
      return;
    }
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };
  const clearPhoto = () => {
    setPhoto(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!user || (!text.trim() && !photo)) return;
    voice.stopAll();
    setPosting(true);
    try {
      const id = await createPost(user.id, text.trim(), photo);
      if (toLinkedIn && liEnabled && text.trim()) {
        const r = await share({ data: { text: text.trim() } });
        if (r.ok) {
          await markLinkedInShared(id);
          toast.success("Posted to Network and LinkedIn");
        } else toast.error(r.error);
      } else toast.success("Posted to Tourism Network");
      setText("");
      clearPhoto();
      onPosted();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex gap-3">
        <MemberAvatar m={profile} size="md" className="shrink-0" />
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={3000}
          placeholder="Share an insight, a shift win, or ask Zimbabwean tourism peers…"
          className="min-h-[80px] flex-1 resize-none border-0 bg-surface/50 rounded-xl p-3 text-sm focus-visible:ring-1 focus-visible:ring-gold/50"
        />
      </div>

      {preview && (
        <div className="relative mt-3 ml-12">
          <img src={preview} alt="" className="max-h-60 rounded-xl border object-cover" />
          <button
            onClick={clearPhoto}
            aria-label="Remove photo"
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {(voice.listening || voice.recording || voice.transcribing) && (
        <p className="ml-12 mt-2 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className={cn("h-2 w-2 rounded-full", voice.transcribing ? "bg-cyan" : "animate-pulse bg-destructive")} />
          {voice.listening
            ? "Listening… speak and your words appear above"
            : voice.recording
            ? "Recording audio note… tap stop when done"
            : "Transcribing your audio note…"}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex items-center gap-1">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ImageIcon className="mr-1.5 h-3.5 w-3.5 text-cyan" /> Photo
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={voice.toggleSpeech}
            disabled={voice.recording}
            className={cn("h-8 px-2.5 text-xs", voice.listening ? "text-destructive font-medium" : "text-muted-foreground hover:text-foreground")}
          >
            <Mic className="mr-1.5 h-3.5 w-3.5 text-gold" /> {voice.listening ? "Stop Dictation" : "Speak"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={voice.toggleRecording}
            disabled={voice.listening || voice.transcribing}
            className={cn("h-8 px-2.5 text-xs", voice.recording ? "text-destructive font-medium" : "text-muted-foreground hover:text-foreground")}
          >
            {voice.transcribing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : voice.recording ? (
              <Square className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <AudioLines className="mr-1.5 h-3.5 w-3.5 text-gold" />
            )}
            Voice Note
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {liEnabled && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={toLinkedIn}
                onChange={(e) => setToLinkedIn(e.target.checked)}
                className="accent-gold rounded"
              />
              <Linkedin className="h-3 w-3 text-cyan" /> LinkedIn
            </label>
          )}

          <Button
            size="sm"
            onClick={submit}
            disabled={posting || (!text.trim() && !photo)}
            className="h-8 px-4 rounded-xl font-medium"
          >
            {posting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Post
          </Button>
        </div>
      </div>
    </div>
  );
}
