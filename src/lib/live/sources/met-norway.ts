import "server-only";
import { getJson } from "../http";
import type { Forecast } from "../types";

/**
 * MET Norway — Locationforecast 2.0 « complete » (prévisions 9 jours, UV inclus).
 * Sans clé ; User-Agent identifiant obligatoire ; 20 requêtes/s max ; licence CC BY 4.0 (mention de la source).
 * https://api.met.no/weatherapi/locationforecast/2.0/documentation
 */
export const SOURCE = "MET Norway";
export const ATTRIBUTION = { text: "Données météo : MET Norway (CC BY 4.0)", href: "https://api.met.no/doc/License" };

type Period = { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
type Response = {
  properties: {
    timeseries: {
      time: string;
      data: {
        instant: {
          details: { air_temperature: number; wind_speed: number; cloud_area_fraction?: number; ultraviolet_index_clear_sky?: number };
        };
        next_1_hours?: Period;
        next_6_hours?: Period;
      };
    }[];
  };
};

export async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${lon}`;
  const json = await getJson<Response>(SOURCE, url);
  const series = json.properties.timeseries;

  const steps = series.map((entry, i) => {
    const next = series[i + 1];
    const hours = next ? Math.round((Date.parse(next.time) - Date.parse(entry.time)) / 3_600_000) : 6;
    const period = hours <= 1 ? entry.data.next_1_hours : entry.data.next_6_hours;
    const d = entry.data.instant.details;
    return {
      time: entry.time,
      hours,
      temperature: d.air_temperature,
      precipitationMm: period?.details?.precipitation_amount ?? null,
      windKmh: Math.round(d.wind_speed * 3.6),
      cloudPct: d.cloud_area_fraction ?? null,
      uvClearSky: d.ultraviolet_index_clear_sky ?? null,
      symbol: period?.summary?.symbol_code ?? null,
    };
  });
  return { lat, lon, steps };
}
