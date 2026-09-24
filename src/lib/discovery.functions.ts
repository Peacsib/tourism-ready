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
  profileUrl: string | null;
  photoUrl: string | null;
  source: "apollo";
  sourceConfidence: "limited" | "partial";
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/apollo";

export const discoverProfessionals = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ query: z.string().trim().min(2).max(120), location: z.string().trim().max(80).optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<{ people: DiscoveredPerson[]; error?: string }> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const apolloKey = process.env["APOLLO_API_KEY"];
    if (!lovableKey || !apolloKey) return { people: [], error: "Professional discovery is not configured yet." };

    const params = new URLSearchParams({ per_page: "12", page: "1" });
    params.append("q_keywords", `${data.query} tourism hospitality`);
    params.append("person_locations[]", data.location || "Zimbabwe");

    const res = await fetch(`${GATEWAY_URL}/api/v1/mixed_people/api_search?${params}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": apolloKey },
    });
    if (!res.ok) {
      console.error(`Apollo search failed [${res.status}]: ${await res.text()}`);
      return { people: [], error: res.status === 403 ? "The connected Apollo account can't search people yet." : "Discovery is temporarily unavailable." };
    }
    const body = (await res.json()) as { people?: Record<string, any>[] };
    const people = (body.people ?? []).map((p): DiscoveredPerson => {
      const first = p["first_name"] ?? "";
      const last = p["last_name"] ?? p["last_name_obfuscated"] ?? "";
      const org = p["organization"] ?? {};
      const title = p["title"] ?? "";
      return {
        id: String(p["id"]),
        name: `${first} ${last}`.trim() || "Tourism professional",
        headline: title,
        role: title,
        company: org["name"] ?? "",
        location: [p["city"], p["country"]].filter(Boolean).join(", "),
        industry: org["industry"] ?? "Tourism & hospitality",
        profileUrl: p["linkedin_url"] ?? null,
        photoUrl: p["photo_url"] ?? null,
        source: "apollo",
        sourceConfidence: p["last_name_obfuscated"] ? "limited" : "partial",
      };
    });
    return { people };
  });
