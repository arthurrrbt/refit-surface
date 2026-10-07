// Formats communs, identiques quelle que soit la source qui a fourni la donnée.

/** Un lieu géocodé. */
export type Place = {
  label: string; // adresse complète lisible
  street: string | null; // « 8 Boulevard des Talards » (null pour une commune)
  postcode: string | null;
  city: string | null;
  lat: number;
  lon: number;
  kind: "adresse" | "rue" | "commune" | "autre";
};

/** Un pas de prévision météo (1 h sur les premiers jours, puis 6 h). */
export type ForecastStep = {
  time: string; // ISO UTC, début du pas
  hours: number; // durée couverte par les cumuls (1 ou 6)
  temperature: number; // °C
  precipitationMm: number | null; // cumul sur le pas
  windKmh: number; // vent moyen
  cloudPct: number | null;
  uvClearSky: number | null; // indice UV par ciel clair
  symbol: string | null; // code de temps de la source
};

export type Forecast = { lat: number; lon: number; steps: ForecastStep[] };

/** Trajet routier. */
export type Route = { km: number; minutes: number | null };

/** Donnée en direct + sa provenance et sa fraîcheur. */
export type Live<T> = {
  data: T;
  source: string; // nom de la source, pour la mention affichée
  fetchedAt: string; // ISO : heure de la dernière mise à jour réussie
  stale: boolean; // true = sources injoignables, dernière valeur connue
};
