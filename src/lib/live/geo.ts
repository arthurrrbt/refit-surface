import "server-only";
import { cacheLife } from "next/cache";
import { site } from "@/content/site";
import { withCache } from "./cache";
import * as ban from "./sources/geoplateforme";
import * as osm from "./sources/nominatim";
import type { Live, Place } from "./types";

const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // une adresse ne bouge pas : 30 jours
const MIN_SCORE = 0.4; // en dessous, la Base Adresse Nationale a probablement trouvé autre chose

export const GEO_ATTRIBUTION = {
  [ban.SOURCE]: { text: "Adresses : Base Adresse Nationale (IGN)", href: "https://adresse.data.gouv.fr" },
  [osm.SOURCE]: { text: "© OpenStreetMap", href: "https://www.openstreetmap.org/copyright" },
} as Record<string, { text: string; href: string }>;

const near = { lat: site.base.lat, lon: site.base.lon };
const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

/** Coordonnées d'une adresse saisie librement. Principale : Base Adresse Nationale ; secours : OpenStreetMap. */
export function geocodeAddress(text: string): Promise<Live<Place> | null> {
  const q = text.replace(/\s+/g, " ").trim().slice(0, 200);
  if (q.length < 3) return Promise.resolve(null);
  return withCache(`geo:${normalize(q)}`, MAX_AGE, [
    {
      name: ban.SOURCE,
      fetch: async () => {
        const [best] = await ban.searchPlaces(q, { limit: 1, near });
        if (!best || best.score < MIN_SCORE) throw new Error("adresse introuvable");
        return best.place;
      },
    },
    {
      name: osm.SOURCE,
      fetch: async () => {
        const place = await osm.geocode(q);
        if (!place) throw new Error("adresse introuvable");
        return place;
      },
    },
  ]);
}

/**
 * Suggestions pendant la saisie (Base Adresse Nationale uniquement : OpenStreetMap interdit l'autocomplétion).
 * Mises en cache une journée par texte saisi. En cas de panne, liste vide : le champ reste une saisie libre.
 */
export async function suggestPlaces(q: string, type: "adresse" | "commune"): Promise<Place[]> {
  "use cache";
  cacheLife("days");
  const results = await ban.searchPlaces(q, { autocomplete: true, limit: 5, near, type: type === "commune" ? "municipality" : undefined });
  return results.map((r) => r.place);
}
