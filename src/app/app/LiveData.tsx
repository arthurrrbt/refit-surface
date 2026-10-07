import { AlertTriangle, Car, CloudSun } from "lucide-react";
import { site } from "@/content/site";
import { addDays, parisDate } from "@/lib/booking/time";
import { GEO_ATTRIBUTION, geocodeAddress } from "@/lib/live/geo";
import { ROUTE_ATTRIBUTION, routeFromBase, STRAIGHT_LINE } from "@/lib/live/route";
import type { Live } from "@/lib/live/types";
import { FORECAST_DAYS, getForecast, summarizeDay, WEATHER_ATTRIBUTION, type DaySummary } from "@/lib/live/weather";

// Données en direct du back-office : chaque bloc est rendu dans un <Suspense>, il ne bloque jamais la page.

const updatedFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "numeric" });

function Freshness({ live, credits }: { live: Live<unknown>; credits: { text: string; href?: string }[] }) {
  return (
    <span className="block text-[11px] text-ink/50">
      {live.stale ? "Source injoignable — dernière valeur connue du " : "Mis à jour le "}
      {updatedFmt.format(new Date(live.fetchedAt))} ·{" "}
      {credits.map((c, i) => (
        <span key={c.text}>
          {i > 0 && " · "}
          {c.href ? (
            <a href={c.href} target="_blank" rel="noreferrer" className="underline">
              {c.text}
            </a>
          ) : (
            c.text
          )}
        </span>
      ))}
    </span>
  );
}

function duration(minutes: number) {
  const m = Math.round(minutes);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

/** Distance et temps de route depuis Saint-Malo, en ligne de liste <dl>. */
export async function TravelInfo({ address }: { address: string }) {
  const place = await geocodeAddress(address);
  if (!place) {
    return <Row label="Trajet">Adresse non localisée</Row>;
  }
  const route = await routeFromBase(place.data);
  const r = route.data;
  const approx = route.source === STRAIGHT_LINE;
  const credits = [
    GEO_ATTRIBUTION[place.source] ?? { text: place.source },
    ROUTE_ATTRIBUTION[route.source] ?? { text: route.source },
  ];
  return (
    <Row label="Trajet">
      <span className="inline-flex items-center gap-1">
        <Car className="size-3.5" />
        {approx ? `≈ ${r.km} km à vol d'oiseau` : `${Math.round(r.km)} km${r.minutes !== null ? ` · ${duration(r.minutes)}` : ""}`} depuis{" "}
        {site.base.label}
      </span>
      {place.data.kind === "commune" && <span className="block text-xs text-ink/60">Centre de la commune (adresse précise non renseignée)</span>}
      <Freshness live={route} credits={credits} />
    </Row>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-ink/60">{label} :</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

async function forecastFor(address: string) {
  const place = await geocodeAddress(address);
  if (!place) return null;
  return getForecast(place.data.lat, place.data.lon);
}

function DayLine({ day }: { day: DaySummary }) {
  return (
    <>
      {day.label} · {day.tempMin}–{day.tempMax} °C · {day.precipitationMm} mm · vent {day.windMaxKmh} km/h
      {day.risks.length > 0 && (
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
          <AlertTriangle className="size-3" /> {day.risks.join(", ")}
        </span>
      )}
    </>
  );
}

/** Météo d'une journée à un lieu (planning). Rien n'est affiché au-delà de l'horizon de prévision. */
export async function EventWeather({ location, date }: { location: string; date: string }) {
  if (date > addDays(parisDate(), FORECAST_DAYS - 1)) return null;
  const live = await forecastFor(location);
  const day = live ? summarizeDay(live.data, date) : null;
  if (!live || !day) return null;
  return (
    <div className="mt-1 text-xs text-ink/70">
      <span className="inline-flex flex-wrap items-center gap-1">
        <CloudSun className="size-3.5" /> <DayLine day={day} />
      </span>
      <Freshness live={live} credits={[WEATHER_ATTRIBUTION]} />
    </div>
  );
}

/** Météo des jours de pose d'un chantier (ou des prochains jours s'il n'est pas planifié). */
export async function JobWeather({ address, start, end }: { address: string; start: string | null; end: string | null }) {
  const today = parisDate();
  const horizon = addDays(today, FORECAST_DAYS - 1);
  const from = start && start > today ? start : today;
  const to = end && end >= from ? end : start && start >= from ? start : addDays(from, 2);
  if (from > horizon) return <p className="text-sm text-ink/60">Prévisions disponibles à partir du {dayFmt.format(new Date(`${addDays(from, -(FORECAST_DAYS - 1))}T12:00:00Z`))}.</p>;

  const live = await forecastFor(address);
  if (!live) return <p className="text-sm text-ink/60">Météo indisponible pour cette adresse.</p>;
  const days: DaySummary[] = [];
  for (let d = from; d <= to && d <= horizon; d = addDays(d, 1)) {
    const day = summarizeDay(live.data, d);
    if (day) days.push(day);
  }
  return (
    <div className="text-sm">
      <ul className="space-y-1">
        {days.map((day) => (
          <li key={day.date} className="flex flex-wrap items-center gap-x-2">
            <span className="w-16 font-semibold first-letter:uppercase">{dayFmt.format(new Date(`${day.date}T12:00:00Z`))}</span>
            <span>
              <DayLine day={day} />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <Freshness live={live} credits={[WEATHER_ATTRIBUTION]} />
      </div>
    </div>
  );
}
