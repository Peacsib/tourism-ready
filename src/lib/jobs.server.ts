// Jobs/Opportunities engine — uses the dedicated SerpAPI jobs account (SERPAPI_JOBS_API_KEY).
// Writes real Google Jobs listings into the canonical public.jobs table as external listings.
import { COMPETENCIES } from "@/lib/data";

const QUERIES = [
  "hotel jobs Zimbabwe", "hospitality jobs Harare", "tourism jobs Zimbabwe", "chef jobs Zimbabwe",
  "lodge jobs Victoria Falls", "front office jobs Zimbabwe", "safari guide jobs Zimbabwe", "restaurant manager jobs Zimbabwe",
  "hospitality internship Zimbabwe", "travel agent jobs Harare", "hotel jobs South Africa", "tourism jobs Botswana",
];
const RELEVANT = /hotel|hospitality|touris|travel|lodge|resort|chef|cook|kitchen|culinary|restaurant|waiter|waitress|barista|bartender|front office|front desk|reception|housekeep|guide|safari|event|concierge|food|beverage|catering|guest|tour|camp|airline|cabin crew|spa/i;

export type JobsReport = { queries_run: number; found: number; relevant: number; inserted: number; updated: number; errors: string[] };

function jobType(s: string | undefined) {
  const t = (s ?? "").toLowerCase();
  if (t.includes("part")) return "Part-time";
  if (t.includes("intern")) return "Internship";
  if (t.includes("contract")) return "Contract";
  if (t.includes("temp") || t.includes("season")) return "Seasonal";
  return "Full-time";
}

type Verdict = { relevant: boolean; skills: string[] };

import { getBackupOpenAIKey, getOpenAIKey } from "@/lib/openai.server";

// Nyanzvi review: confirms each job is genuinely tourism/hospitality and picks passport skills.
// Returns null on any failure so the keyword filter still applies.
async function aiReview(jobs: Record<string, any>[], skillNames: string[]): Promise<Verdict[] | null> {
  let key = getOpenAIKey();
  if (!jobs.length) return null;
  try {
    const list = jobs.map((x, i) => `${i}. ${String(x["title"] ?? "")} @ ${String(x["company_name"] ?? "")}: ${String(x["description"] ?? "").slice(0, 500)}`).join("\n");
    let r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `You review job listings for a tourism & hospitality workforce platform. For each job decide if it is genuinely a tourism, travel, hospitality, food service, events or guiding role (not e.g. software, mining, finance roles that merely mention a hotel). Pick up to 5 matching skills ONLY from this list: ${skillNames.join("; ")}. Reply as JSON {"jobs":[{"i":0,"relevant":true,"skills":["..."]}]}.` },
          { role: "user", content: list },
        ],
      }),
    });
    const backupKey = getBackupOpenAIKey();
    if (r.status === 401 && key !== backupKey) {
      key = backupKey;
      r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: `You review job listings for a tourism & hospitality workforce platform. For each job decide if it is genuinely a tourism, travel, hospitality, food service, events or guiding role (not e.g. software, mining, finance roles that merely mention a hotel). Pick up to 5 matching skills ONLY from this list: ${skillNames.join("; ")}. Reply as JSON {"jobs":[{"i":0,"relevant":true,"skills":["..."]}]}.` },
            { role: "user", content: list },
          ],
        }),
      });
    }
    if (!r.ok) return null;
    const j = await r.json();
    const parsed = JSON.parse(j?.choices?.[0]?.message?.content ?? "{}") as { jobs?: { i: number; relevant: boolean; skills?: string[] }[] };
    const out: Verdict[] = jobs.map(() => ({ relevant: true, skills: [] }));
    for (const v of parsed.jobs ?? []) if (out[v.i]) out[v.i] = { relevant: v.relevant !== false, skills: v.skills ?? [] };
    return out;
  } catch { return null; }
}

export async function runJobsDiscovery(): Promise<JobsReport> {
  const key = process.env["SERPAPI_JOBS_API_KEY"];
  if (!key) throw new Error("Jobs search key is not configured");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const report: JobsReport = { queries_run: 0, found: 0, relevant: 0, inserted: 0, updated: 0, errors: [] };
  // Rotate queries: 6 per run, by day of year.
  const day = Math.floor(Date.now() / 86400000);
  const picks = Array.from({ length: 6 }, (_, i) => QUERIES[(day * 6 + i) % QUERIES.length]!);
  const skillNames = COMPETENCIES.map((c) => c.name);

  for (const q of picks) {
    try {
      const u = new URL("https://serpapi.com/search.json");
      u.search = new URLSearchParams({ engine: "google_jobs", q, hl: "en", api_key: key }).toString();
      const r = await fetch(u);
      report.queries_run++;
      if (!r.ok) { report.errors.push(`${q}: ${r.status}`); continue; }
      const j = (await r.json()) as { jobs_results?: Record<string, any>[] };
      const rows = j.jobs_results ?? [];
      report.found += rows.length;
      const candidates = rows.filter((x) => {
        const t = String(x["title"] ?? "").trim();
        return t && RELEVANT.test(`${t} ${String(x["description"] ?? "").slice(0, 400)}`);
      });
      const review = await aiReview(candidates, skillNames);
      for (const [idx, x] of candidates.entries()) {
        const title = String(x["title"] ?? "").trim();
        const desc = String(x["description"] ?? "");
        const verdict = review?.[idx];
        if (verdict && !verdict.relevant) continue;
        report.relevant++;
        const org = String(x["company_name"] ?? "Employer");
        const loc = String(x["location"] ?? "Zimbabwe");
        const apply = (x["apply_options"] as { link?: string }[] | undefined)?.[0]?.link ?? x["share_link"] ?? null;
        const text = `${title} ${desc}`.toLowerCase();
        const aiSkills = (verdict?.skills ?? []).filter((s) => skillNames.includes(s));
        const skills = aiSkills.length ? aiSkills.slice(0, 5) : skillNames.filter((s) => s.toLowerCase().split(/\s+/).some((w) => w.length > 4 && text.includes(w))).slice(0, 5);
        const dedupe = `serp:${(x["job_id"] as string | undefined)?.slice(0, 120) ?? `${title}|${org}|${loc}`.toLowerCase()}`;
        const row = {
          dedupe_key: dedupe, title: title.slice(0, 200), organisation: org.slice(0, 200), location: loc.slice(0, 200),
          job_type: jobType(x["detected_extensions"]?.["schedule_type"]), description: desc.slice(0, 4000), skills,
          is_external: true, source: "google_jobs", apply_url: apply, active: true, last_synced_at: new Date().toISOString(),
        };
        const { data: existing } = await supabaseAdmin.from("jobs").select("id").eq("dedupe_key", dedupe).maybeSingle();
        const { error } = existing
          ? await supabaseAdmin.from("jobs").update(row).eq("id", existing.id)
          : await supabaseAdmin.from("jobs").insert(row);
        if (error) report.errors.push(error.message);
        else if (existing) report.updated++; else report.inserted++;
      }
    } catch (e) { report.errors.push(`${q}: ${(e as Error).message}`); }
  }
  // Retire external listings not seen for 30 days.
  await supabaseAdmin.from("jobs").update({ active: false }).eq("is_external", true).lt("last_synced_at", new Date(Date.now() - 30 * 86400000).toISOString());
  return report;
}
