import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// The LinkedIn connection belongs to the platform owner's account, so only
// administrators may use it. Members see LinkedIn actions once per-member
// LinkedIn sign-in is available.
const GATEWAY = "https://connector-gateway.lovable.dev/linkedin";

function keys() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const li = process.env["LINKEDIN_API_KEY"];
  if (!lovable || !li) throw new Error("LinkedIn isn't connected.");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": li };
}

async function isAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export const linkedinStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ enabled: await isAdmin(context.supabase, context.userId) }));

export const importLinkedInProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) return { ok: false as const, error: "LinkedIn import is limited to the account that connected LinkedIn." };
    const res = await fetch(`${GATEWAY}/v2/userinfo`, { headers: keys() });
    if (!res.ok) { const t = await res.text(); console.error("LinkedIn userinfo", res.status, t); return { ok: false as const, error: `LinkedIn said: ${res.status}` }; }
    const u = (await res.json()) as { name?: string; picture?: string; locale?: { country?: string } | string };
    const update: { full_name?: string; avatar_url?: string } = {};
    if (u.name) update.full_name = u.name;
    if (u.picture) update.avatar_url = u.picture;
    if (Object.keys(update).length) {
      const { error } = await context.supabase.from("profiles").update(update).eq("id", context.userId);
      if (error) return { ok: false as const, error: error.message };
    }
    return { ok: true as const, name: u.name ?? null, picture: u.picture ?? null };
  });

export const shareToLinkedIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ text: z.string().trim().min(1).max(2900) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) return { ok: false as const, error: "Sharing to LinkedIn is limited to the account that connected LinkedIn." };
    const h = keys();
    const me = await fetch(`${GATEWAY}/v2/userinfo`, { headers: h });
    if (!me.ok) return { ok: false as const, error: `LinkedIn said: ${me.status}` };
    const { sub } = (await me.json()) as { sub: string };
    const res = await fetch(`${GATEWAY}/v2/ugcPosts`, {
      method: "POST",
      headers: { ...h, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({
        author: `urn:li:person:${sub}`,
        lifecycleState: "PUBLISHED",
        specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text: data.text }, shareMediaCategory: "NONE" } },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    if (!res.ok) { const t = await res.text(); console.error("LinkedIn share", res.status, t); return { ok: false as const, error: res.status === 403 ? "LinkedIn didn't allow posting — the connection needs permission to share posts." : `LinkedIn said: ${res.status}` }; }
    return { ok: true as const };
  });
