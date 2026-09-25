import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { COMPETENCIES } from "@/lib/data";

async function isAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export const eventsAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ admin: await isAdmin(context.supabase, context.userId) }));

export const refreshEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) return { ok: false as const, error: "Only admins can refresh events." };
    const { runEventDiscovery } = await import("./events.server");
    const report = await runEventDiscovery(COMPETENCIES.map((c) => c.name));
    return { ok: true as const, report };
  });

export const reviewEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject", "archive"]) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) return { ok: false as const };
    const status = data.action === "approve" ? "verified" : data.action === "reject" ? "rejected" : "archived";
    const { error } = await context.supabase.from("events").update({ status, is_verified: status === "verified", updated_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: !error };
  });
