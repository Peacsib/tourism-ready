import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DiscoveredPerson = {
  id: string;
  name: string;
  headline: string;
  role: string;
  company: string;
  location: string;
  industry: string;
  jobLevel: string;
  jobFunction: string;
  skills: string[];
  profileUrl: string | null;
  photoUrl: string | null;
  source: "enrich";
};

const ENRICH_URL = "https://dev.enrich.so/api/v3/lead-finder/search";
const CACHE_HOURS = 24;

const searchSchema = z.object({
  query: z.string().trim().min(2).max(120),
  location: z.string().trim().max(80).optional(),
  jobLevel: z.string().trim().max(40).optional(),
});

function str(v: unknown): string {
  return typeof v === "string" && v !== "0" ? v.trim() : "";
}

export const discoverProfessionals = createServerFn({ method: "POST" })
  .inputValidator((d) => searchSchema.parse(d))
  .handler(async ({ data }): Promise<{ people: DiscoveredPerson[]; error?: string }> => {
    const key = process.env["STRIPE_LIVE_API_KEY"];
    if (!key) return { people: [], error: "External discovery isn't available right now. Showing Tourism Workforce members." };

    const location = data.location || "Zimbabwe";
    const cacheKey = JSON.stringify([data.query.toLowerCase(), location.toLowerCase(), data.jobLevel ?? ""]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    try {
      const { data: cached } = await supabaseAdmin.from("discovery_cache").select("results, created_at").eq("cache_key", cacheKey).maybeSingle();
      if (cached && Date.now() - new Date(cached.created_at).getTime() < CACHE_HOURS * 3600_000) {
        return { people: cached.results as unknown as DiscoveredPerson[] };
      }
    } catch (e) { console.error("cache read failed", e); }

    const filters: Record<string, unknown> = { personHeadline: [data.query], countryName: location };
    if (data.jobLevel) filters["jobLevel"] = data.jobLevel;

    let res: Response;
    try {
      res = await fetch(ENRICH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify({ filters, page: 1, pageSize: 12 }),
      });
    } catch (e) {
      console.error("Enrich request failed", e);
      return { people: [], error: "External discovery is temporarily unavailable. Showing Tourism Workforce members." };
    }
    if (!res.ok) {
      console.error(`Enrich search failed [${res.status}]: ${await res.text()}`);
      const msg = res.status === 402 || res.status === 429
        ? "External discovery has reached its limit for now. Showing Tourism Workforce members."
        : "External discovery is temporarily unavailable. Showing Tourism Workforce members.";
      return { people: [], error: msg };
    }
    const body = (await res.json()) as { data?: { results?: Record<string, unknown>[] } };
    const people = (body.data?.results ?? []).map((p): DiscoveredPerson => {
      const name = [str(p["firstName"]), str(p["lastName"])].filter(Boolean).join(" ");
      const skills = str(p["skills"]).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
      const photo = str(p["logoUrl"]);
      return {
        id: String(p["id"]),
        name: name || "Tourism professional",
        headline: str(p["linkedinHeadline"]),
        role: str(p["jobTitle"]),
        company: str(p["companyName"]),
        location: [str(p["city"]), str(p["countryName"])].filter(Boolean).join(", "),
        industry: str(p["industryNaicsDescription"]) || str(p["industrySicDescription"]),
        jobLevel: str(p["jobLevel"]),
        jobFunction: str(p["jobFunction"]),
        skills,
        profileUrl: str(p["linkedinUrl"]) || null,
        photoUrl: photo.includes("profile-displayphoto") ? photo : null,
        source: "enrich",
      };
    });

    try {
      await supabaseAdmin.from("discovery_cache").upsert({ cache_key: cacheKey, results: people as never, created_at: new Date().toISOString() });
      if (people.length) {
        await supabaseAdmin.from("external_professionals").upsert(people.map((p) => ({
          id: p.id, name: p.name, headline: p.headline, role: p.role, company: p.company, location: p.location, profile_url: p.profileUrl, source: "enrich", last_seen_at: new Date().toISOString(),
        })));
      }
    } catch (e) { console.error("cache write failed", e); }

    return { people };
  });

export const inviteProfessional = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      person: z.object({ id: z.string().min(1).max(200), name: z.string().max(200), headline: z.string().max(500), role: z.string().max(200), company: z.string().max(200), location: z.string().max(200), profileUrl: z.string().url().max(500).nullable() }),
      invitedBy: z.string().trim().min(1).max(120),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const p = data.person;
    const { error: e1 } = await supabaseAdmin.from("external_professionals").upsert({ id: p.id, name: p.name, headline: p.headline, role: p.role, company: p.company, location: p.location, profile_url: p.profileUrl, source: "enrich" });
    if (e1) { console.error(e1); return { ok: false }; }
    const { error } = await supabaseAdmin.from("discovery_invitations").upsert({ professional_id: p.id, invited_by: data.invitedBy }, { onConflict: "professional_id,invited_by" });
    if (error) { console.error(error); return { ok: false }; }
    return { ok: true };
  });
