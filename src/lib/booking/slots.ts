import "server-only";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { booking, type SlotDay } from "./config";
import { addDays, formatDayLong, formatTime, parisDate, parisToUtc, weekday } from "./time";

/**
 * Créneaux libres : horaires hebdomadaires moins le délai minimum et tout événement
 * déjà au planning (rendez-vous, poses, indisponibilités). Seules les heures sortent du serveur.
 */
export async function getAvailableSlots(): Promise<SlotDay[]> {
  await connection(); // dépend de l'heure courante : calculé à chaque requête
  const now = Date.now();
  const earliest = now + booking.minNoticeHours * 3600_000;
  const today = parisDate();
  const lastDay = addDays(today, booking.horizonDays);

  const { data: events } = await createAdminClient()
    .from("events")
    .select("starts_at, ends_at")
    .lt("starts_at", parisToUtc(addDays(lastDay, 1), "00:00").toISOString())
    .gt("ends_at", new Date(now).toISOString());
  const busy = (events ?? []).map((e) => [new Date(e.starts_at).getTime(), new Date(e.ends_at).getTime()]);

  const days: SlotDay[] = [];
  for (let i = 0; i <= booking.horizonDays; i++) {
    const date = addDays(today, i);
    const ranges = booking.weekly[weekday(date)] ?? [];
    const slots: SlotDay["slots"] = [];
    for (const [from, to] of ranges) {
      const rangeEnd = parisToUtc(date, to).getTime();
      for (let t = parisToUtc(date, from).getTime(); t + booking.slotMinutes * 60_000 <= rangeEnd; t += booking.slotMinutes * 60_000) {
        const end = t + booking.slotMinutes * 60_000;
        if (t < earliest) continue;
        if (busy.some(([s, e]) => s < end && e > t)) continue;
        slots.push({ start: new Date(t).toISOString(), end: new Date(end).toISOString(), label: formatTime.format(t) });
      }
    }
    if (slots.length) days.push({ date, label: formatDayLong.format(parisToUtc(date, "12:00")), slots });
  }
  return days;
}
