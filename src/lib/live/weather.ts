import "server-only";
import { parisDate } from "@/lib/booking/time";
import { withCache } from "./cache";
import * as met from "./sources/met-norway";
import type { Forecast, Live } from "./types";

export const WEATHER_ATTRIBUTION = met.ATTRIBUTION;
const MAX_AGE = 60 * 60 * 1000; // rafraîchie toutes les heures

/** Horizon des prévisions disponibles (en jours, aujourd'hui compris). */
export const FORECAST_DAYS = 9;

/**
 * Prévisions pour un point. Les coordonnées sont arrondies à 0,01° (~1 km) :
 * suffisant pour la météo, sans transmettre l'adresse exacte du client, et mieux mis en cache.
 * Pas de source de secours : si MET Norway tombe, dernière prévision connue.
 */
export function getForecast(lat: number, lon: number): Promise<Live<Forecast> | null> {
  const la = Math.round(lat * 100) / 100;
  const lo = Math.round(lon * 100) / 100;
  return withCache(`meteo:${la},${lo}`, MAX_AGE, [{ name: met.SOURCE, fetch: () => met.fetchForecast(la, lo) }]);
}

export type DaySummary = {
  date: string; // AAAA-MM-JJ (Paris)
  tempMin: number;
  tempMax: number;
  precipitationMm: number;
  windMaxKmh: number;
  uvMax: number | null;
  label: string; // temps dominant en français
  risks: string[]; // alertes pour une pose en extérieur
};

// Seuils indicatifs pour une pose en extérieur — à ajuster selon l'expérience du terrain.
export const RISK_THRESHOLDS = { rainMm: 2, windKmh: 40, tempMinC: 5 };

/** Résumé d'une journée (heure de Paris), ou null si hors de l'horizon de prévision. */
export function summarizeDay(forecast: Forecast, date: string): DaySummary | null {
  const steps = forecast.steps.filter((s) => parisDate(new Date(s.time)) === date);
  if (!steps.length) return null;
  const temps = steps.map((s) => s.temperature);
  const uv = steps.map((s) => s.uvClearSky).filter((v): v is number => v !== null);
  const precipitationMm = Math.round(steps.reduce((sum, s) => sum + (s.precipitationMm ?? 0), 0) * 10) / 10;
  const windMaxKmh = Math.max(...steps.map((s) => s.windKmh));
  const tempMin = Math.round(Math.min(...temps));
  const tempMax = Math.round(Math.max(...temps));

  // Temps dominant : celui du pas le plus proche de midi
  const noon = steps.reduce((best, s) => (Math.abs(parisHour(new Date(s.time)) - 12) < Math.abs(parisHour(new Date(best.time)) - 12) ? s : best));

  const risks: string[] = [];
  if (precipitationMm >= RISK_THRESHOLDS.rainMm) risks.push(`pluie ${precipitationMm} mm`);
  if (windMaxKmh >= RISK_THRESHOLDS.windKmh) risks.push(`vent ${windMaxKmh} km/h`);
  if (tempMin < RISK_THRESHOLDS.tempMinC) risks.push(`froid ${tempMin} °C`);
  if (noon.symbol?.includes("thunder")) risks.push("orages");

  return {
    date,
    tempMin,
    tempMax,
    precipitationMm,
    windMaxKmh,
    uvMax: uv.length ? Math.round(Math.max(...uv)) : null,
    label: symbolLabel(noon.symbol),
    risks,
  };
}

const hourFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Paris" });

/** Heure (0 à 23) à Paris. Format anglais : en français, Intl renvoie « 22 h », non convertible en nombre. */
export function parisHour(instant: Date) {
  return Number(hourFmt.format(instant));
}

/** Codes de temps MET Norway (ex. « lightrainshowers_day ») → libellé français. */
export function symbolLabel(symbol: string | null) {
  if (!symbol) return "—";
  const s = symbol.replace(/_(day|night|polartwilight)$/, "");
  if (s.includes("thunder")) return "Orages";
  if (s.includes("sleet")) return "Pluie et neige";
  if (s.includes("snow")) return "Neige";
  if (s.includes("heavyrain")) return "Forte pluie";
  if (s.includes("rainshowers")) return "Averses";
  if (s.includes("lightrain")) return "Pluie faible";
  if (s.includes("rain")) return "Pluie";
  if (s === "fog") return "Brouillard";
  if (s === "cloudy") return "Couvert";
  if (s === "partlycloudy") return "Éclaircies";
  if (s === "fair") return "Peu nuageux";
  if (s === "clearsky") return "Ensoleillé";
  return "—";
}

/** Échelle de l'OMS pour l'indice UV. */
export function uvCategory(uv: number) {
  if (uv <= 2) return "faible";
  if (uv <= 5) return "modéré";
  if (uv <= 7) return "élevé";
  if (uv <= 10) return "très élevé";
  return "extrême";
}
