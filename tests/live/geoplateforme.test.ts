// Appelle la vraie API de géocodage IGN (Base Adresse Nationale) et vérifie les champs utilisés.
import assert from "node:assert/strict";
import { test } from "node:test";
import { searchPlaces } from "@/lib/live/sources/geoplateforme";

const near = { lat: 48.6465, lon: -2.0066 };

test("Géoplateforme : autocomplétion d'une adresse", async () => {
  const [result] = await searchPlaces("8 bd des talards", { autocomplete: true, limit: 3, near });
  assert.ok(result, "au moins un résultat");
  assert.equal(typeof result.score, "number", "score");
  const best = result.place;
  assert.equal(best.kind, "adresse");
  assert.equal(best.postcode, "35400");
  assert.equal(best.city, "Saint-Malo");
  assert.match(best.street ?? "", /Talards/);
  assert.ok(Math.abs(best.lat - 48.65) < 0.05 && Math.abs(best.lon + 2.01) < 0.05, "coordonnées à Saint-Malo");
});

test("Géoplateforme : recherche de communes", async () => {
  const results = await searchPlaces("dina", { autocomplete: true, type: "municipality", near });
  assert.ok(results.length > 0);
  assert.ok(results.every((r) => r.place.kind === "commune"));
  assert.ok(results.some((r) => r.place.city === "Dinard" && r.place.postcode === "35800"));
});
