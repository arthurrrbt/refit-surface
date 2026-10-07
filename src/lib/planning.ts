import "server-only";
import { requireUser } from "@/lib/auth";
import type { EventKind } from "@/lib/booking/config";
import { parisDate } from "@/lib/booking/time";
import { createClient } from "@/lib/supabase/server";

export type PlanningEvent = {
  id: string;
  kind: EventKind;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  notes: string | null;
  lead_id: string | null;
  booked_online: boolean;
};

/** Événements à venir (et ceux du jour), regroupés par date de Paris. */
export async function getUpcomingEvents(days = 60) {
  await requireUser();
  const supabase = await createClient();
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + days * 24 * 3600_000);
  const { data, error } = await supabase
    .from("events")
    .select("id, kind, title, starts_at, ends_at, location, notes, lead_id, booked_online")
    .gte("ends_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at");
  if (error) throw error;

  const groups = new Map<string, PlanningEvent[]>();
  for (const event of data as PlanningEvent[]) {
    const key = parisDate(new Date(event.starts_at));
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()].map(([date, events]) => ({ date, events }));
}
