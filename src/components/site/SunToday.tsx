"use client";

import { useEffect, useState } from "react";
import { Sun } from "lucide-react";
import type { SiteWeather } from "@/app/api/meteo/route";

const timeFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });

/** Encart « UV du jour (ou du lendemain le soir) à Saint-Malo » (page Glass). Les données passent par notre serveur (/api/meteo). */
export function SunToday() {
  const [weather, setWeather] = useState<SiteWeather | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/meteo", { signal: controller.signal })
      .then((r) => r.json())
      .then(setWeather)
      .catch(() => setWeather({ available: false }));
    return () => controller.abort();
  }, []);

  // Rien tant que la donnée n'est pas là, et rien du tout si elle est indisponible : la page reste intacte
  if (!weather?.available) return null;

  return (
    <aside className="mt-10 flex flex-col gap-3 rounded-sm border border-line bg-ink-2 p-5 sm:flex-row sm:items-center sm:gap-5">
      <Sun className="size-8 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0">
        <p className="font-display font-semibold">
          {weather.when} à {weather.place} : {weather.label.toLowerCase()},{" "}
          {weather.tempMin === weather.tempMax ? weather.tempMin : `${weather.tempMin}–${weather.tempMax}`} °C
          {weather.uvMax !== null && (
            <>
              {" "}
              · indice UV jusqu&apos;à {weather.uvMax} ({weather.uvCategory}) par ciel clair
            </>
          )}
        </p>
        <p className="mt-1 text-sm text-paper/65">
          Chaleur, éblouissement, décoloration : un film solaire adapté se choisit selon l&apos;exposition de vos vitrages.
        </p>
        <p className="mt-2 text-[11px] text-paper/50">
          {weather.stale ? "Dernière prévision connue, " : "Mis à jour à "}
          {timeFmt.format(new Date(weather.fetchedAt))} ·{" "}
          <a href={weather.attribution.href} target="_blank" rel="noreferrer" className="underline">
            {weather.attribution.text}
          </a>
        </p>
      </div>
    </aside>
  );
}
