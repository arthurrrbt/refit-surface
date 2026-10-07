import { timingSafeEqual } from "node:crypto";
import { eventKindLabels, type EventKind } from "@/lib/booking/config";
import { buildIcs } from "@/lib/booking/ics";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Flux iCalendar du planning, pour abonnement dans Outlook (« À partir d'Internet »).
 * Protégé par un jeton secret dans l'URL (PLANNING_ICS_TOKEN).
 */
export async function GET(request: Request) {
  const expected = process.env.PLANNING_ICS_TOKEN;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!expected || token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    return new Response("Non autorisé", { status: 401 });
  }

  const from = new Date(Date.now() - 30 * 24 * 3600_000);
  const to = new Date(Date.now() + 180 * 24 * 3600_000);
  const { data, error } = await createAdminClient()
    .from("events")
    .select("id, kind, title, starts_at, ends_at, location, notes")
    .gte("ends_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at");
  if (error) return new Response("Erreur", { status: 500 });

  const ics = buildIcs(
    data.map((e) => ({
      uid: `${e.id}@refitsurface.fr`,
      start: e.starts_at,
      end: e.ends_at,
      summary: e.title || eventKindLabels[e.kind as EventKind],
      location: e.location,
      description: e.notes,
    })),
    "REFIT Surface — Planning",
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="planning-refit.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
