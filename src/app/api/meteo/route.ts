import { connection, NextResponse } from "next/server";
import { site } from "@/content/site";
import { addDays, parisDate } from "@/lib/booking/time";
import { getForecast, parisHour, summarizeDay, uvCategory, WEATHER_ATTRIBUTION } from "@/lib/live/weather";

export type SiteWeather =
  | {
      available: true;
      place: string;
      when: "Aujourd'hui" | "Demain";
      label: string;
      tempMin: number;
      tempMax: number;
      uvMax: number | null;
      uvCategory: string | null;
      fetchedAt: string;
      stale: boolean;
      attribution: { text: string; href: string };
    }
  | { available: false };

/** Météo du jour à Saint-Malo pour le site public (lieu fixe : aucune coordonnée ne vient du visiteur). */
export async function GET() {
  await connection();
  // Après 18 h, la journée est presque finie : on présente le lendemain
  const when = parisHour(new Date()) >= 18 ? "Demain" : "Aujourd'hui";
  const date = when === "Demain" ? addDays(parisDate(), 1) : parisDate();
  const live = await getForecast(site.base.lat, site.base.lon);
  const day = live ? summarizeDay(live.data, date) : null;
  if (!live || !day) return NextResponse.json({ available: false } satisfies SiteWeather);

  const body: SiteWeather = {
    available: true,
    place: site.base.label,
    when,
    label: day.label,
    tempMin: day.tempMin,
    tempMax: day.tempMax,
    uvMax: day.uvMax,
    uvCategory: day.uvMax === null ? null : uvCategory(day.uvMax),
    fetchedAt: live.fetchedAt,
    stale: live.stale,
    attribution: WEATHER_ATTRIBUTION,
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=300, s-maxage=900" } });
}
