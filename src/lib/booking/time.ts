// Conversions heure de Paris ↔ UTC sans dépendance (gère l'heure d'été).

const TZ = "Europe/Paris";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Décalage de Paris par rapport à UTC (en minutes) à un instant donné. */
function parisOffsetMinutes(instant: Date) {
  const parts = partsFormatter.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** « 2026-10-08 » + « 09:30 » (heure de Paris) → instant UTC. */
export function parisToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let utc = guess - parisOffsetMinutes(new Date(guess)) * 60000;
  // Second passage pour les jours de changement d'heure
  utc = guess - parisOffsetMinutes(new Date(utc)) * 60000;
  return new Date(utc);
}

/** Date du jour à Paris au format AAAA-MM-JJ. */
export function parisDate(instant: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(instant);
}

/** Ajoute des jours à une date AAAA-MM-JJ. */
export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Jour de la semaine d'une date AAAA-MM-JJ (0 = dimanche). */
export function weekday(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const formatTime = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export const formatDayLong = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
