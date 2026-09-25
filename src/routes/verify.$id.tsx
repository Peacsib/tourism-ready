import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, CheckCircle2, ExternalLink, Search, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verify/$id")({
  head: () => ({
    meta: [
      { title: "Verify Skills Passport — Tourism Workforce 2031" },
      { name: "description", content: "Publicly verify a candidate's Tourism Skills Passport, demonstrated competencies, and industry simulation records." },
      { property: "og:site_name", content: "Tourism Workforce 2031" },
      { property: "og:title", content: "Verified Tourism Skills Passport — Tourism Workforce 2031" },
      { property: "og:description", content: "Publicly verify candidate competencies and simulation achievements for Zimbabwe's tourism & hospitality sector." },
      { property: "og:type", content: "profile" },
      { property: "og:image", content: "https://tourism-ready.vercel.app/og-image.jpg" },
      { property: "og:image:secure_url", content: "https://tourism-ready.vercel.app/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1024" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "Tourism Skills Passport Verification" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Verified Tourism Skills Passport — Tourism Workforce 2031" },
      { name: "twitter:description", content: "Publicly verify candidate competencies and simulation achievements." },
      { name: "twitter:image", content: "https://tourism-ready.vercel.app/og-image.jpg" },
    ],
  }),
  component: VerifyPage,
});

type Profile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  organisation: string | null;
  location: string | null;
  avatar_url: string | null;
  role: string;
};

type Competency = {
  competency_id: string;
  name: string;
  category: string;
  level: number;
  state: string;
};

type SimAttempt = {
  id: string;
  sim_id: string;
  title: string;
  scores: { label: string; score: number }[];
  taken_on: string | null;
  added_to_passport: boolean;
};

function StatePill({ state }: { state: string }) {
  const map: Record<string, string> = {
    Verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Demonstrated: "bg-amber-100 text-amber-700 border-amber-200",
    Practising: "bg-sky-100 text-sky-700 border-sky-200",
    Developing: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", map[state] ?? map.Developing)}>
      {state}
    </span>
  );
}

function VerifyPage() {
  const { id } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [attempts, setAttempts] = useState<SimAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Employer candidate search
  const [searchMode, setSearchMode] = useState(false);
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);

      // Try to resolve: if id looks like a UUID use it directly; otherwise search by passport-style ID pattern
      const isUuid = /^[0-9a-f-]{36}$/.test(id);

      let userId = id;

      if (!isUuid) {
        // Passport IDs are in format ZW-2031-XX0417 — we can't easily reverse engineer
        // so we show not found for non-UUID for now
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, full_name, headline, organisation, location, avatar_url, role")
        .eq("id", userId)
        .single();

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      const [{ data: comps }, { data: sims }] = await Promise.all([
        supabase
          .from("user_competencies")
          .select("competency_id, name, category, level, state")
          .eq("user_id", userId)
          .order("level", { ascending: false }),
        supabase
          .from("sim_attempts")
          .select("id, sim_id, title, scores, taken_on, added_to_passport")
          .eq("user_id", userId)
          .eq("added_to_passport", true)
          .order("created_at", { ascending: false }),
      ]);

      setCompetencies((comps as Competency[]) ?? []);
      setAttempts((sims as SimAttempt[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  const searchCandidates = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, headline, organisation, location, avatar_url, role")
      .ilike("full_name", `%${searchQuery}%`)
      .limit(20);
    setCandidates((data as Profile[]) ?? []);
    setSearchLoading(false);
  };

  const verified = competencies.filter((c) => c.state === "Verified");
  const demonstrated = competencies.filter((c) => c.state === "Demonstrated");
  const passportId = profile ? `ZW-2031-${(profile.full_name ?? "?").split(" ").map((n) => n[0]).join("")}417` : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading passport…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
            <span className="font-semibold text-slate-800">Tourism Workforce 2031</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant={searchMode ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode((v) => !v)}
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Employer Search
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Employer candidate search panel */}
        {searchMode && (
          <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Search verified candidates</p>
            <p className="mb-4 text-xs text-slate-400">Find Tourism Workforce professionals by name</p>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchCandidates()}
                className="flex-1"
              />
              <Button onClick={searchCandidates} disabled={searchLoading}>
                {searchLoading ? "Searching…" : "Search"}
              </Button>
            </div>
            {candidates.length > 0 && (
              <ul className="mt-4 divide-y rounded-xl border">
                {candidates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.full_name}</p>
                      <p className="text-xs text-slate-400">{c.headline} · {c.organisation}</p>
                    </div>
                    <Link to="/verify/$id" params={{ id: c.id }}>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="mr-1 h-3 w-3" /> View Passport
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {notFound ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <User className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-700">Passport not found</p>
            <p className="mt-2 text-sm text-slate-400">
              This passport ID does not match any verified candidate. Please check the link and try again.
            </p>
            <Link to="/" className="mt-6 inline-block">
              <Button variant="outline">Back to home</Button>
            </Link>
          </div>
        ) : profile ? (
          <>
            {/* Verification stamp */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Verified Skills Passport</p>
                <p className="font-mono text-xs text-emerald-600">
                  {passportId} · Issued by Tourism Workforce 2031
                </p>
              </div>
            </div>

            {/* Profile card */}
            <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-700">
                  {(profile.full_name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{profile.full_name}</h1>
                  <p className="text-slate-500">{profile.headline}</p>
                  <p className="text-sm text-slate-400">
                    {profile.organisation} {profile.location ? `· ${profile.location}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-4 border-t pt-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-800">{verified.length}</p>
                  <p className="text-xs text-slate-400">Verified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{demonstrated.length}</p>
                  <p className="text-xs text-slate-400">Demonstrated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{attempts.length}</p>
                  <p className="text-xs text-slate-400">Simulations Passed</p>
                </div>
              </div>
            </div>

            {/* Competencies */}
            {competencies.length > 0 && (
              <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-slate-700">Competency Record</p>
                <div className="space-y-3">
                  {competencies.map((c) => (
                    <div key={c.competency_id} className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                          <StatePill state={c.state} />
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              c.state === "Verified" || c.state === "Demonstrated"
                                ? "bg-amber-400"
                                : "bg-sky-400"
                            )}
                            style={{ width: `${c.level}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{c.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulation results */}
            {attempts.length > 0 && (
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-slate-700">Simulation Achievements</p>
                <div className="space-y-3">
                  {attempts.map((a) => (
                    <div key={a.id} className="flex items-center gap-4 rounded-xl border bg-slate-50 p-4">
                      <Award className="h-8 w-8 shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                        {a.taken_on && (
                          <p className="text-xs text-slate-400">Completed {a.taken_on}</p>
                        )}
                        {Array.isArray(a.scores) && a.scores.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(a.scores as { label: string; score: number }[]).map((s) => (
                              <span key={s.label} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                {s.label}: {s.score}%
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {competencies.length === 0 && attempts.length === 0 && (
              <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-400">
                No passport data has been added to this public profile yet.
              </div>
            )}
          </>
        ) : null}
      </main>

      <footer className="mt-16 border-t bg-white py-6 text-center text-xs text-slate-400">
        Tourism Workforce 2031 · Skills Passport Verification System ·{" "}
        <Link to="/" className="underline hover:text-slate-600">
          Return to platform
        </Link>
      </footer>
    </div>
  );
}
