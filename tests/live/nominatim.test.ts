// Appelle la vraie API Nominatim (OpenStreetMap) et vérifie les champs utilisés. Un seul appel (limite : 1/s).
import assert from "node:assert/strict";
import { test } from "node:test";
import { geocode } from "@/lib/live/sources/nominatim";

test("Nominatim : géocodage d'une adresse de Saint-Malo", async () => {
  const place = await geocode("8 boulevard des Talards 35400 Saint-Malo");
  assert.ok(place, "un résultat");
  assert.ok(place.label.includes("Saint-Malo"), "display_name");
  assert.ok(Math.abs(place.lat - 48.65) < 0.05 && Math.abs(place.lon + 2.01) < 0.05, "lat / lon");
});
