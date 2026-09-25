import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const refreshJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (data !== true) return { ok: false as const, error: "Only admins can refresh jobs." };
    const { runJobsDiscovery } = await import("./jobs.server");
    return { ok: true as const, report: await runJobsDiscovery() };
  });
