import { supabase } from "@/integrations/supabase/client";
import type { Competency } from "./data";
import type { Notification, SimAttempt, TimelineEntry } from "./store";

export type CloudState = {
  competencies: Competency[];
  attempts: SimAttempt[];
  timeline: TimelineEntry[];
  connections: string[];
  pending: string[];
  reacted: string[];
  savedPosts: string[];
  savedOpps: string[];
  applied: string[];
  courseProgress: Record<string, number>;
  hubRegistrations: string[];
  notifications: Notification[];
};

type AppStateBlob = Omit<CloudState, "competencies" | "attempts" | "timeline">;

/** Reads a signed-in member's Skills Passport and activity from the cloud. */
export async function loadCloudState(userId: string): Promise<CloudState | null> {
  const [comps, attempts, timeline, profile] = await Promise.all([
    supabase.from("user_competencies").select("*").eq("user_id", userId),
    supabase.from("sim_attempts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("user_timeline").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("profiles").select("app_state").eq("id", userId).maybeSingle(),
  ]);

  if (!comps.data || comps.data.length === 0) return null;

  const blob = (profile.data?.app_state ?? {}) as Partial<AppStateBlob>;

  return {
    competencies: comps.data.map((c) => ({
      id: c.competency_id,
      name: c.name,
      category: c.category,
      level: c.level,
      state: c.state,
      links: Array.isArray(c.links) ? (c.links as string[]) : [],
    })) as Competency[],
    attempts: (attempts.data ?? []).map((a) => ({
      id: a.id,
      simId: a.sim_id,
      title: a.title,
      scores: (a.scores ?? []) as SimAttempt["scores"],
      competencies: (a.competencies ?? []) as string[],
      addedToPassport: a.added_to_passport,
      date: a.taken_on ?? "",
    })),
    timeline: (timeline.data ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      title: t.title,
      detail: t.detail ?? "",
      date: t.entry_date ?? "",
    })),
    connections: blob.connections ?? [],
    pending: blob.pending ?? [],
    reacted: blob.reacted ?? [],
    savedPosts: blob.savedPosts ?? [],
    savedOpps: blob.savedOpps ?? [],
    applied: blob.applied ?? [],
    courseProgress: blob.courseProgress ?? {},
    hubRegistrations: blob.hubRegistrations ?? [],
    notifications: blob.notifications ?? [],
  };
}

/** Writes the member's Skills Passport and activity to the cloud. */
export async function saveCloudState(userId: string, s: CloudState): Promise<void> {
  const blob: AppStateBlob = {
    connections: s.connections,
    pending: s.pending,
    reacted: s.reacted,
    savedPosts: s.savedPosts,
    savedOpps: s.savedOpps,
    applied: s.applied,
    courseProgress: s.courseProgress,
    hubRegistrations: s.hubRegistrations,
    notifications: s.notifications.slice(0, 40),
  };

  await Promise.all([
    supabase.from("user_competencies").upsert(
      s.competencies.map((c) => ({
        user_id: userId,
        competency_id: c.id,
        name: c.name,
        category: c.category,
        level: c.level,
        state: c.state,
        links: c.links,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,competency_id" },
    ),
    s.attempts.length
      ? supabase.from("sim_attempts").upsert(
          s.attempts.map((a) => ({
            id: a.id,
            user_id: userId,
            sim_id: a.simId,
            title: a.title,
            scores: a.scores,
            competencies: a.competencies,
            added_to_passport: a.addedToPassport,
            taken_on: a.date,
          })),
          { onConflict: "user_id,id" },
        )
      : Promise.resolve(),
    s.timeline.length
      ? supabase.from("user_timeline").upsert(
          s.timeline.map((t) => ({
            id: t.id,
            user_id: userId,
            type: t.type,
            title: t.title,
            detail: t.detail,
            entry_date: t.date,
          })),
          { onConflict: "user_id,id" },
        )
      : Promise.resolve(),
    supabase.from("profiles").update({ app_state: blob, updated_at: new Date().toISOString() }).eq("id", userId),
  ]);
}
