// Appelle la vraie API d'itinéraire IGN et vérifie les champs utilisés.
import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchRoute } from "@/lib/live/sources/ign-itineraire";

test("IGN itinéraire : Saint-Malo → Rennes en voiture", async () => {
  const route = await fetchRoute({ lat: 48.6465, lon: -2.0066 }, { lat: 48.1113, lon: -1.6797 });
  assert.ok(route.km > 55 && route.km < 90, `distance plausible (${route.km} km)`);
  assert.ok(route.minutes !== null && route.minutes > 40 && route.minutes < 120, `durée plausible (${route.minutes} min)`);
});
