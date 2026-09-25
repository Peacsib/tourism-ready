// Live Events engine: SerpAPI discovers, OpenAI web search verifies/enriches,
// SerpAPI Google Images resolves imagery, and the events table is the one canonical store.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OPENAI_MODEL = "gpt-6-luna";
const QUERY_TTL_H = 24;
const MAX_QUERIES = 12;
const MAX_VERIFY = 10;

export type RunReport = {
  queries_run: number; candidates_found: number; duplicates_removed: number;
  verified_count: number; rejected_count: number; updated_count: number;
  images_found: number; images_failed: number; errors: string[];
};

type Candidate = {
  title: string; dateText: string | null; venue: string | null; address: string | null;
  link: string | null; thumbnail: string | null; description: string | null;
  tickets: { source: string; link: string }[]; query: string;
};

// ---------- helpers ----------
export function normTitle(t: string) {
  return t.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(19|20)\d{2}\b/g, " ").replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\b(the|annual|edition|\d+(st|nd|rd|th))\b/g, " ")
    .replace(/\s+/g, " ").trim();
}
function tokens(t: string) { return new Set(normTitle(t).split(" ").filter((w) => w.length > 2)); }
function similar(a: string, b: string) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((w) => { if (B.has(w)) inter++; });
  return inter / Math.min(A.size, B.size);
}
function domain(u: string | null | undefined) { try { return u ? new URL(u).hostname.replace(/^www\./, "") : null; } catch { return null; } }

const RELEVANT = /touris|hospitalit|hotel|travel|tour operator|destination|mice|meeting|incentive|exhibition|expo|conference|summit|forum|trade show|heritage|cultur|festival|safari|eco|sustainab|conservation|culinary|food|wine|chef|revenue|customer experience|aviation|airline|investment|entrepreneur|careers?|education|indaba|lodge|resort|wildlife/;
function relevant(c: Candidate) { return RELEVANT.test(`${c.title} ${c.description ?? ""}`.toLowerCase()); }

function buildQueries() {
  const y = new Date().getFullYear();
  const zw = ["tourism events Zimbabwe", "tourism conference Zimbabwe", "hospitality events Zimbabwe", "tourism expo Zimbabwe", "MICE Zimbabwe", "tourism investment Zimbabwe", "tourism conference Harare", "hospitality conference Harare", "tourism events Victoria Falls", "tourism events Bulawayo", "travel events Zimbabwe", "tourism technology Zimbabwe"];
  const sa = ["tourism conference Southern Africa", "hospitality conference South Africa", "travel expo South Africa", "tourism events Zambia Botswana"];
  const af = ["Africa tourism conference", "Africa hospitality investment summit", "sustainable tourism conference Africa"];
  const gl = ["hospitality technology conference", "AI tourism conference", "travel trade show"];
  // Google shows its events panel mostly for "events in <place>" phrasing, so lead with those.
  const panel = ["tourism events in Harare", "conferences in Harare", "events in Victoria Falls", "expos in Zimbabwe", "events in Bulawayo", "tourism conferences in Johannesburg", "hospitality events in Cape Town", "tourism events in Nairobi"];
  const all = [...panel, ...zw.map((q) => `${q} ${y}`), ...zw.slice(0, 4).map((q) => `${q} ${y + 1}`), ...sa.map((q) => `${q} ${y}`), ...af.map((q) => `${q} ${y}`), ...gl.map((q) => `${q} ${y}`)];
  return Array.from(new Set(all));
}

async function serp(params: Record<string, string>) {
  const key = process.env["SERPAPI_API_KEY"];
  if (!key) throw new Error("SerpAPI key missing");
  const u = new URL("https://serpapi.com/search.json");
  Object.entries({ ...params, api_key: key, hl: "en" }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  if (!r.ok) throw new Error(`SerpAPI ${params["engine"]} ${r.status}`);
  return (await r.json()) as Record<string, unknown>;
}

// ---------- providers ----------
async function serpApiDiscover(query: string): Promise<Candidate[]> {
  const j = await serp({ engine: "google", q: query, gl: "zw" });
  const list = (j["events_results"] as Record<string, any>[] | undefined) ?? [];
  return list.filter((e) => typeof e["title"] === "string").map((e) => ({
    title: String(e["title"]).trim(),
    dateText: e["date"]?.when ?? e["date"]?.start_date ?? null,
    venue: e["venue"]?.name ?? null,
    address: Array.isArray(e["address"]) ? e["address"].join(", ") : null,
    link: e["link"] ?? null,
    thumbnail: e["image"] ?? e["thumbnail"] ?? null,
    description: e["description"] ?? null,
    tickets: Array.isArray(e["ticket_info"]) ? e["ticket_info"].filter((t: any) => t?.link).map((t: any) => ({ source: String(t.source ?? ""), link: String(t.link) })) : [],
    query,
  }));
}

const VERIFY_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["found", "is_tourism_relevant", "relevance_score", "relevance_reason", "title", "description", "ai_summary", "category", "start_datetime", "end_datetime", "timezone", "venue_name", "venue_address", "city", "country", "organiser_name", "official_url", "registration_url", "ticket_url", "event_status", "verification_source_url", "verification_source_name", "related_skills"],
  properties: {
    found: { type: "boolean" },
    is_tourism_relevant: { type: "boolean" },
    relevance_score: { type: "integer" },
    relevance_reason: { type: ["string", "null"] },
    title: { type: ["string", "null"] }, description: { type: ["string", "null"] }, ai_summary: { type: ["string", "null"] },
    category: { type: ["string", "null"], enum: ["Tourism", "Hospitality", "Travel", "MICE", "Digital & AI", "Sustainability", "Education", "Entrepreneurship", "Cultural Tourism", "Sports Tourism", null] },
    start_datetime: { type: ["string", "null"] }, end_datetime: { type: ["string", "null"] }, timezone: { type: ["string", "null"] },
    venue_name: { type: ["string", "null"] }, venue_address: { type: ["string", "null"] }, city: { type: ["string", "null"] }, country: { type: ["string", "null"] },
    organiser_name: { type: ["string", "null"] }, official_url: { type: ["string", "null"] }, registration_url: { type: ["string", "null"] }, ticket_url: { type: ["string", "null"] },
    event_status: { type: "string", enum: ["scheduled", "cancelled", "postponed", "past", "unclear"] },
    verification_source_url: { type: ["string", "null"] }, verification_source_name: { type: ["string", "null"] },
    related_skills: { type: "array", items: { type: "string" } },
  },
} as const;
export type Verified = { [K in keyof typeof VERIFY_SCHEMA.properties]: any };

async function openAiVerify(c: Candidate, skills: string[]): Promise<Verified | null> {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OpenAI key missing");
  const y = new Date().getFullYear();
  const prompt = `Verify this event using web search. Search for "${c.title}" ${c.address ?? ""} ${y}, then "${c.title}" official, organiser and registration. Prefer the official organiser, venue, government/tourism authority, recognised associations, institutions, reputable event platforms, then reputable media.
Candidate from Google: ${JSON.stringify({ title: c.title, date: c.dateText, venue: c.venue, address: c.address, link: c.link, description: c.description })}
Today is ${new Date().toISOString().slice(0, 10)}.
Rules: never invent anything. Any field you can't confirm from a source is null. Dates as ISO 8601. found=false if you cannot confirm the event exists. ai_summary: 1-2 factual sentences based only on sources, no invented speakers, sponsors, prices or attendance. registration_url/ticket_url only if a real page exists. relevance_score 0-100 for a Zimbabwean tourism & hospitality workforce audience. related_skills: pick 0-4 from exactly this list: ${skills.join("; ")}.`;
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: OPENAI_MODEL, input: prompt, tools: [{ type: "web_search" }], stream: true, store: false, text: { format: { type: "json_schema", name: "event_verification", strict: true, schema: VERIFY_SCHEMA } } }),
  });
  if (!r.ok || !r.body) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const reader = r.body.getReader(); const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop() ?? "";
    for (const l of lines) {
      if (!l.startsWith("data:")) continue;
      try { const ev = JSON.parse(l.slice(5)); if (ev.type === "response.output_text.delta") out += ev.delta; } catch { /* partial */ }
    }
  }
  try { return JSON.parse(out) as Verified; } catch { return null; }
}

async function serpApiImage(title: string, city: string | null, officialUrl: string | null) {
  const y = new Date().getFullYear();
  const j = await serp({ engine: "google_images", q: `"${title}" ${city ?? ""} ${y}`.trim() });
  const imgs = ((j["images_results"] as Record<string, any>[] | undefined) ?? []).slice(0, 20);
  const off = domain(officialUrl);
  const scored = imgs.map((im) => {
    const d = domain(im["link"]);
    let s = similar(title, String(im["title"] ?? ""));
    const official = !!off && !!d && (d === off || d.endsWith("." + off));
    if (official) s += 1;
    return { im, s, official };
  }).filter((x) => x.s >= 0.5 && x.im["original"]).sort((a, b) => b.s - a.s);
  const best = scored[0];
  if (!best) return null;
  return {
    image_url: String(best.im["original"]),
    image_thumbnail_url: best.im["thumbnail"] ? String(best.im["thumbnail"]) : null,
    image_source_url: best.im["link"] ? String(best.im["link"]) : null,
    image_source_name: best.im["source"] ? String(best.im["source"]) : domain(best.im["link"]),
    image_license: best.im["license_details_url"] ? String(best.im["license_details_url"]) : null,
    image_attribution: `Image: ${best.im["source"] ?? domain(best.im["link"]) ?? "external source"}`,
    image_source_type: best.official ? "official_event" : "external_thumbnail",
    image_verified: best.official,
  };
}

// ---------- pipeline ----------
export async function runEventDiscovery(skills: string[]): Promise<RunReport> {
  const rep: RunReport = { queries_run: 0, candidates_found: 0, duplicates_removed: 0, verified_count: 0, rejected_count: 0, updated_count: 0, images_found: 0, images_failed: 0, errors: [] };
  const { data: run } = await supabaseAdmin.from("event_sync_runs").insert({ provider: "serpapi_google+openai_web_search" }).select("id").single();
  const now = new Date();

  // 1. freshness: mark past events
  await supabaseAdmin.from("events").update({ status: "past", updated_at: now.toISOString() })
    .in("status", ["verified", "postponed"]).lt("end_datetime", now.toISOString());
  await supabaseAdmin.from("events").update({ status: "past", updated_at: now.toISOString() })
    .in("status", ["verified", "postponed"]).is("end_datetime", null).lt("start_datetime", new Date(now.getTime() - 86400000).toISOString());

  // 2. queries not run within TTL
  const queries = buildQueries();
  const { data: logs } = await supabaseAdmin.from("event_search_log").select("query,last_run_at").in("query", queries);
  const recent = new Set((logs ?? []).filter((l) => now.getTime() - new Date(l.last_run_at).getTime() < QUERY_TTL_H * 3600000).map((l) => l.query));
  const toRun = queries.filter((q) => !recent.has(q)).slice(0, MAX_QUERIES);

  const raw: Candidate[] = [];
  await Promise.all(toRun.map(async (q) => {
    try {
      const r = await serpApiDiscover(q); raw.push(...r); rep.queries_run++;
      await supabaseAdmin.from("event_search_log").upsert({ query: q, engine: "google", last_run_at: now.toISOString(), result_count: r.length });
    } catch (e) { rep.errors.push(`Search "${q}": ${(e as Error).message}`); }
  }));
  rep.candidates_found = raw.length;

  // 3. relevance + in-batch dedupe
  const uniq: Candidate[] = [];
  for (const c of raw.filter(relevant)) {
    const dup = uniq.find((u) => similar(u.title, c.title) >= 0.85 && (u.address ?? "") .split(",").pop()?.trim() === (c.address ?? "").split(",").pop()?.trim());
    if (dup) { rep.duplicates_removed++; if (!dup.thumbnail && c.thumbnail) dup.thumbnail = c.thumbnail; dup.tickets.push(...c.tickets); } else uniq.push(c);
  }
  rep.rejected_count += raw.length - raw.filter(relevant).length;

  // 4. skip candidates already canonical & freshly verified
  const { data: existing } = await supabaseAdmin.from("events").select("id,title,city,dedupe_key,last_verified_at,start_datetime,status").neq("status", "archived");
  const pick: { c: Candidate; existingId: string | null }[] = [];
  for (const c of uniq) {
    const ex = (existing ?? []).find((e) => similar(e.title, c.title) >= 0.85);
    if (ex) {
      const stale = !ex.last_verified_at || now.getTime() - new Date(ex.last_verified_at).getTime() > 7 * 86400000;
      const soon = ex.start_datetime && new Date(ex.start_datetime).getTime() - now.getTime() < 14 * 86400000;
      if (!stale && !soon) { rep.duplicates_removed++; continue; }
      pick.push({ c, existingId: ex.id });
    } else pick.push({ c, existingId: null });
  }

  // 5. verify (bounded concurrency)
  const batch = pick.slice(0, MAX_VERIFY);
  for (let i = 0; i < batch.length; i += 4) {
    await Promise.all(batch.slice(i, i + 4).map(async ({ c, existingId }) => {
      let v: Verified | null = null;
      try { v = await openAiVerify(c, skills); } catch (e) { rep.errors.push(`Verify "${c.title}": ${(e as Error).message}`); }
      const base = {
        source: "serpapi_google", title: c.title, source_description: c.description, date_text: c.dateText,
        venue_name: c.venue, venue_address: c.address, last_synced_at: now.toISOString(), updated_at: now.toISOString(),
      };
      if (!v) {
        // verification failed — keep as candidate, never publish as verified
        if (!existingId) await supabaseAdmin.from("events").upsert({ ...base, dedupe_key: `${normTitle(c.title)}|${normTitle(c.address?.split(",").pop() ?? "")}`, status: "candidate" }, { onConflict: "dedupe_key", ignoreDuplicates: true });
        return;
      }
      const ok = v.found && v.is_tourism_relevant && v.relevance_score >= 40 && !!v.verification_source_url;
      const status = !ok ? (v.found ? "rejected" : "needs_review")
        : v.event_status === "cancelled" ? "cancelled" : v.event_status === "postponed" ? "postponed"
        : v.event_status === "past" ? "past" : v.event_status === "unclear" ? "needs_review" : "verified";
      if (ok) rep.verified_count++; else rep.rejected_count++;
      const title = v.title || c.title;
      const rec: Record<string, unknown> = {
        ...base, title, description: v.description, ai_summary: v.ai_summary, category: v.category,
        start_datetime: v.start_datetime, end_datetime: v.end_datetime, timezone: v.timezone,
        venue_name: v.venue_name ?? c.venue, venue_address: v.venue_address ?? c.address, city: v.city, country: v.country,
        organiser_name: v.organiser_name, official_url: v.official_url ?? null,
        registration_url: v.registration_url, ticket_url: v.ticket_url ?? c.tickets[0]?.link ?? null,
        status, is_verified: status === "verified", verification_source_url: v.verification_source_url,
        verification_source_name: v.verification_source_name, verified_at: ok ? now.toISOString() : null, last_verified_at: now.toISOString(),
        relevance_score: v.relevance_score, tourism_relevance_reason: v.relevance_reason,
        related_skills: (v.related_skills as string[]).filter((s) => skills.includes(s)).slice(0, 4),
      };
      // images only for publishable events
      if (ok) {
        try {
          const img = await serpApiImage(title, v.city, v.official_url);
          if (img) { Object.assign(rec, img); rep.images_found++; }
          else if (c.thumbnail) { Object.assign(rec, { image_url: c.thumbnail, image_thumbnail_url: c.thumbnail, image_source_type: "event_provider", image_source_name: "Google Events", image_attribution: "Image: event listing", image_verified: false }); rep.images_found++; }
          else { rec["image_source_type"] = "approved_fallback"; rep.images_failed++; }
        } catch (e) { rep.images_failed++; rep.errors.push(`Image "${title}": ${(e as Error).message}`); }
      }
      const key = `${normTitle(title)}|${normTitle(String(v.city ?? c.address?.split(",").pop() ?? ""))}`;
      const { error } = existingId
        ? await supabaseAdmin.from("events").update(rec as never).eq("id", existingId)
        : await supabaseAdmin.from("events").upsert({ ...rec, dedupe_key: key } as never, { onConflict: "dedupe_key" });
      if (error) rep.errors.push(`Save "${title}": ${error.message}`);
      else if (existingId) rep.updated_count++;
    }));
  }

  if (run) await supabaseAdmin.from("event_sync_runs").update({ ...rep, errors: rep.errors, completed_at: new Date().toISOString() }).eq("id", run.id);
  return rep;
}

export async function upcomingEventsForAI(limit = 25) {
  const { data } = await supabaseAdmin.from("events")
    .select("id,title,category,start_datetime,date_text,city,country,venue_name,ai_summary,related_skills,status")
    .in("status", ["verified", "postponed"]).gte("start_datetime", new Date(Date.now() - 86400000).toISOString())
    .order("start_datetime", { ascending: true }).limit(limit);
  return data ?? [];
}
