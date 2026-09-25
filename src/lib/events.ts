import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];

export async function fetchEvents(opts: { admin?: boolean } = {}) {
  let q = supabase.from("events").select("*").order("start_datetime", { ascending: true, nullsFirst: false }).limit(200);
  if (!opts.admin) q = q.in("status", ["verified", "postponed", "cancelled", "past"]);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchEvent(id: string) {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSavedEventIds(userId: string) {
  const { data } = await supabase.from("saved_events").select("event_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.event_id));
}

export async function toggleSavedEvent(userId: string, eventId: string, saved: boolean) {
  if (saved) await supabase.from("saved_events").delete().eq("user_id", userId).eq("event_id", eventId);
  else await supabase.from("saved_events").insert({ user_id: userId, event_id: eventId });
}

export function eventDate(e: Pick<EventRow, "start_datetime" | "end_datetime" | "date_text">) {
  if (!e.start_datetime) return e.date_text ?? "Date to be confirmed";
  const f = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return e.end_datetime && f(e.end_datetime) !== f(e.start_datetime) ? `${f(e.start_datetime)} – ${f(e.end_datetime)}` : f(e.start_datetime);
}

export function eventPlace(e: Pick<EventRow, "city" | "country" | "venue_address">) {
  return [e.city, e.country].filter(Boolean).join(", ") || e.venue_address || "Location to be confirmed";
}
