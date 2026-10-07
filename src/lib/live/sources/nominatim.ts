import "server-only";
import { getJson } from "../http";
import type { Place } from "../types";

/**
 * Nominatim (OpenStreetMap) — secours du géocodage, jamais pour l'autocomplétion.
 * Sans clé ; User-Agent identifiant obligatoire ; 1 requête/s au maximum ; données © OpenStreetMap (ODbL).
 * https://operations.osmfoundation.org/policies/nominatim/
 */
export const SOURCE = "© OpenStreetMap";

type Result = { lat: string; lon: string; display_name: string };

export async function geocode(q: string): Promise<Place | null> {
  const params = new URLSearchParams({ q, format: "jsonv2", limit: "1", countrycodes: "fr" });
  const [first] = await getJson<Result[]>(SOURCE, `https://nominatim.openstreetmap.org/search?${params}`);
  if (!first) return null;
  return {
    label: first.display_name,
    street: null,
    postcode: null,
    city: null,
    lat: Number(first.lat),
    lon: Number(first.lon),
    kind: "autre",
  };
}
