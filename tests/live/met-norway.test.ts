// Appelle la vraie API MET Norway et vérifie que les champs utilisés par le site existent toujours.
import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchForecast } from "@/lib/live/sources/met-norway";

test("MET Norway : prévisions pour Saint-Malo", async () => {
  const forecast = await fetchForecast(48.65, -2.01);
  assert.ok(forecast.steps.length > 24, "au moins 24 pas de prévision");

  const first = forecast.steps[0];
  assert.equal(typeof first.temperature, "number", "air_temperature");
  assert.equal(typeof first.windKmh, "number", "wind_speed");
  assert.equal(first.hours, 1, "pas horaire en début de série");
  assert.ok(forecast.steps.some((s) => s.precipitationMm !== null), "precipitation_amount");
  assert.ok(forecast.steps.some((s) => s.uvClearSky !== null), "ultraviolet_index_clear_sky");
  assert.ok(forecast.steps.some((s) => typeof s.symbol === "string"), "symbol_code");
});
