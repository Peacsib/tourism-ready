import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { COMPETENCIES } from "@/lib/data";

// Daily automatic Events refresh (called by the scheduler). Existing events stay intact on failure.
export const Route = createFileRoute("/api/public/hooks/refresh-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        try {
          const { runEventDiscovery } = await import("@/lib/events.server");
          const report = await runEventDiscovery(COMPETENCIES.map((c) => c.name));
          return Response.json({ ok: true, report });
        } catch (e) {
          console.error("Scheduled events refresh failed", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
