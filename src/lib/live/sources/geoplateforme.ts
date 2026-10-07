import "server-only";
import { getJson } from "../http";
import type { Place } from "../types";

/**
 * IGN Géoplateforme — service de géocodage (Base Adresse Nationale), qui remplace l'API Adresse BAN.
 * Sans clé ; 50 requêtes/s par IP ; Licence Ouverte Etalab (mention de la source).
 * https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage
 */
export const SOURCE = "Base Adresse Nationale (IGN)";

type Feature = {
  geometry: { coordinates: [number, number] };
  properties: { label: string; name?: string; postcode?: string; city?: string; type?: string; score?: number };
};

const kinds: Record<string, Place["kind"]> = { housenumber: "adresse", street: "rue", municipality: "commune", locality: "rue" };

function toPlace(f: Feature): Place {
  const p = f.properties;
  const kind = kinds[p.type ?? ""] ?? "autre";
  return {
    label: p.label,
    street: kind === "adresse" || kind === "rue" ? (p.name ?? null) : null,
    postcode: p.postcode ?? null,
    city: p.city ?? null,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    kind,
  };
}

export async function searchPlaces(
  q: string,
  options: { autocomplete?: boolean; limit?: number; type?: "municipality"; near?: { lat: number; lon: number } } = {},
): Promise<{ place: Place; score: number }[]> {
  const params = new URLSearchParams({ q, limit: String(options.limit ?? 5), index: "address" });
  if (options.autocomplete) params.set("autocomplete", "1");
  if (options.type) params.set("type", options.type);
  if (options.near) {
    params.set("lat", String(options.near.lat));
    params.set("lon", String(options.near.lon));
  }
  const json = await getJson<{ features: Feature[] }>(SOURCE, `https://data.geopf.fr/geocodage/search?${params}`);
  return json.features.map((f) => ({ place: toPlace(f), score: f.properties.score ?? 0 }));
}
