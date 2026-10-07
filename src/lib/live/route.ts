import "server-only";
import { site } from "@/content/site";
import { withCache } from "./cache";
import * as ign from "./sources/ign-itineraire";
import type { Live, Route } from "./types";

const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 jours
export const STRAIGHT_LINE = "Calcul à vol d'oiseau";

export const ROUTE_ATTRIBUTION: Record<string, { text: string; href: string }> = {
  [ign.SOURCE]: { text: "Itinéraire : IGN Géoplateforme", href: "https://geoservices.ign.fr/services-geoplateforme-itineraire" },
};

type Point = { lat: number; lon: number };

/**
 * Trajet en voiture depuis la base (Saint-Malo). Principale : IGN.
 * Si aucune source ne répond et qu'aucun trajet n'est connu : distance à vol d'oiseau, signalée comme telle.
 */
export async function routeFromBase(to: Point): Promise<Live<Route>> {
  const key = `trajet:${to.lat.toFixed(3)},${to.lon.toFixed(3)}`;
  const live = await withCache(key, MAX_AGE, [{ name: ign.SOURCE, fetch: () => ign.fetchRoute(site.base, to) }]);
  if (live) return live;
  return {
    data: { km: Math.round(haversineKm(site.base, to) * 10) / 10, minutes: null },
    source: STRAIGHT_LINE,
    fetchedAt: new Date().toISOString(),
    stale: false,
  };
}

function haversineKm(a: Point, b: Point) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
