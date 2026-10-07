import "server-only";
import { getJson, SourceError } from "../http";
import type { Route } from "../types";

/**
 * IGN Géoplateforme — calcul d'itinéraire (graphe BD TOPO, moteur OSRM).
 * Sans clé ; 5 requêtes/s par IP ; Licence Ouverte Etalab (mention de la source).
 * https://geoservices.ign.fr/documentation/services/services-geoplateforme/itineraire
 */
export const SOURCE = "IGN Géoplateforme";

type Point = { lat: number; lon: number };

export async function fetchRoute(from: Point, to: Point): Promise<Route> {
  const params = new URLSearchParams({
    resource: "bdtopo-osrm",
    start: `${from.lon},${from.lat}`,
    end: `${to.lon},${to.lat}`,
    profile: "car",
    optimization: "fastest",
    getSteps: "false",
    getBbox: "false",
    geometryFormat: "geojson",
    distanceUnit: "kilometer",
    timeUnit: "minute",
  });
  const json = await getJson<{ distance?: number; duration?: number }>(SOURCE, `https://data.geopf.fr/navigation/itineraire?${params}`);
  if (typeof json.distance !== "number") throw new SourceError(SOURCE, "distance absente de la réponse");
  return { km: json.distance, minutes: typeof json.duration === "number" ? json.duration : null };
}
