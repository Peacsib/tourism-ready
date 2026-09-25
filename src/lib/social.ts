import { supabase } from "@/integrations/supabase/client";

// Safe public columns only — never select email for other members.
export const MEMBER_COLS = "id, full_name, headline, organisation, location, avatar_url, bio, role, goal";
export type Member = { id: string; full_name: string | null; headline: string | null; organisation: string | null; location: string | null; avatar_url: string | null; bio: string | null; role: string; goal: string | null };

export type FeedPost = {
  id: string; author_id: string; body: string; image_path: string | null; image_url: string | null; linkedin_shared: boolean; created_at: string;
  author: Member | null; likes: string[]; comments: { id: string; body: string; created_at: string; author: Member | null }[];
};

export const initials = (name?: string | null) => (name ?? "Member").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "M";
export const displayName = (m?: Member | null) => m?.full_name || "Tourism Workforce member";
export const ROLE_LABEL: Record<string, string> = { student: "Student", professional: "Tourism Professional", employer: "Employer", educator: "Educator", entrepreneur: "Entrepreneur", admin: "Administrator" };

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m}m`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h`;
  const d = Math.round(h / 24); if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }

export async function fetchFeed(authorId?: string): Promise<FeedPost[]> {
  let q = supabase.from("posts")
    .select(`id, author_id, body, image_path, linkedin_shared, created_at,
      author:profiles!posts_author_id_fkey(${MEMBER_COLS}),
      post_likes(user_id),
      post_comments(id, body, created_at, author:profiles!post_comments_author_id_fkey(${MEMBER_COLS}))`)
    .order("created_at", { ascending: false }).limit(50);
  if (authorId) q = q.eq("author_id", authorId);
  const { data, error } = await q;
  fail(error);
  const rows = (data ?? []) as any[];
  const paths = rows.map((r) => r.image_path).filter(Boolean) as string[];
  const urls: Record<string, string> = {};
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("post-images").createSignedUrls(paths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
  }
  return rows.map((r) => ({
    ...r,
    image_url: r.image_path ? urls[r.image_path] ?? null : null,
    likes: (r.post_likes ?? []).map((l: { user_id: string }) => l.user_id),
    comments: [...(r.post_comments ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));
}

export async function createPost(userId: string, body: string, image?: File | null) {
  let image_path: string | null = null;
  if (image) {
    if (image.size > 5 * 1024 * 1024) throw new Error("Photos must be under 5 MB.");
    const ext = (image.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    image_path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(image_path, image, { contentType: image.type });
    fail(error);
  }
  const { data, error } = await supabase.from("posts").insert({ author_id: userId, body: body.slice(0, 3000), image_path }).select("id").single();
  fail(error);
  return data!.id as string;
}

export async function deletePost(id: string) { const { error } = await supabase.from("posts").delete().eq("id", id); fail(error); }
export async function markLinkedInShared(id: string) { await supabase.from("posts").update({ linkedin_shared: true }).eq("id", id); }

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  const { error } = liked
    ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId)
    : await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  fail(error);
}

export async function addComment(postId: string, userId: string, body: string) {
  const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: userId, body: body.slice(0, 1000) });
  fail(error);
}

export async function fetchMembers(excludeId?: string, search = ""): Promise<Member[]> {
  let q = supabase.from("profiles").select(MEMBER_COLS).order("created_at", { ascending: false }).limit(60);
  if (excludeId) q = q.neq("id", excludeId);
  const s = search.trim().replace(/[%,()]/g, " ");
  if (s) q = q.or(`full_name.ilike.%${s}%,headline.ilike.%${s}%,organisation.ilike.%${s}%,location.ilike.%${s}%`);
  const { data, error } = await q;
  fail(error);
  return (data ?? []) as Member[];
}

export async function fetchMember(id: string): Promise<Member | null> {
  const { data, error } = await supabase.from("profiles").select(MEMBER_COLS).eq("id", id).maybeSingle();
  fail(error);
  return data as Member | null;
}

export type Conn = { id: string; requester_id: string; addressee_id: string; status: "pending" | "accepted"; created_at: string; other: Member | null };

export async function fetchMyConnections(userId: string): Promise<Conn[]> {
  const { data, error } = await supabase.from("connections")
    .select(`id, requester_id, addressee_id, status, created_at,
      requester:profiles!connections_requester_id_fkey(${MEMBER_COLS}),
      addressee:profiles!connections_addressee_id_fkey(${MEMBER_COLS})`)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  fail(error);
  return ((data ?? []) as any[]).map((c) => ({ ...c, other: c.requester_id === userId ? c.addressee : c.requester }));
}

export async function countConnections(userId: string) {
  const { count } = await supabase.from("connections").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  return count ?? 0;
}

export async function requestConnection(from: string, to: string, intro?: string) {
  if (from === to) throw new Error("You can't connect with yourself.");
  const member = await fetchMember(to);
  if (!member) throw new Error("That member is no longer on Tourism Workforce.");
  const { data: existing } = await supabase.from("connections").select("id, status")
    .or(`and(requester_id.eq.${from},addressee_id.eq.${to}),and(requester_id.eq.${to},addressee_id.eq.${from})`).maybeSingle();
  if (existing) throw new Error(existing.status === "accepted" ? "You're already connected." : "A request is already pending.");
  const { error } = await supabase.from("connections").insert({ requester_id: from, addressee_id: to, intro_message: intro?.trim().slice(0, 1000) || null });
  if (error?.code === "23505") throw new Error("A request is already pending.");
  fail(error);
}

export type AppNotification = { id: string; kind: "connection_request" | "connection_accepted" | string; connection_id: string | null; body: string | null; read_at: string | null; created_at: string; actor: Member | null; connection_status: string | null };
export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase.from("notifications")
    .select(`id, kind, connection_id, body, read_at, created_at, actor:profiles!notifications_actor_id_fkey(${MEMBER_COLS}), connection:connections(status)`)
    .order("created_at", { ascending: false }).limit(30);
  fail(error);
  return ((data ?? []) as any[]).map((n) => ({ ...n, connection_status: n.connection?.status ?? null }));
}
export async function markNotificationRead(id: string) { await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null); }
export async function markAllNotificationsRead(userId: string) { await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null); }
export async function acceptConnection(id: string) { const { error } = await supabase.from("connections").update({ status: "accepted" }).eq("id", id); fail(error); }
export async function removeConnection(id: string) { const { error } = await supabase.from("connections").delete().eq("id", id); fail(error); }

export type DM = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null };
export async function fetchInbox(userId: string): Promise<DM[]> {
  const { data, error } = await supabase.from("direct_messages").select("*").or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order("created_at", { ascending: true }).limit(500);
  fail(error);
  return (data ?? []) as DM[];
}
export async function sendDM(from: string, to: string, body: string) { const { error } = await supabase.from("direct_messages").insert({ sender_id: from, recipient_id: to, body: body.slice(0, 2000) }); fail(error); }
export async function markRead(userId: string, otherId: string) { await supabase.from("direct_messages").update({ read_at: new Date().toISOString() }).eq("recipient_id", userId).eq("sender_id", otherId).is("read_at", null); }

export type Job = { id: string; employer_id: string | null; is_external: boolean; source: string; apply_url: string | null; title: string; organisation: string; location: string; job_type: string; description: string; skills: string[]; closes_on: string | null; active: boolean; created_at: string };
export async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(100);
  fail(error);
  return (data ?? []) as Job[];
}
