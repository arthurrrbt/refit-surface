"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { univers } from "@/content/univers";
import type { PublicGalleryProject } from "@/lib/gallery-shared";
import { BeforeAfter } from "./BeforeAfter";

const filters = [{ slug: "tous", label: "Tous" }, ...univers.map((u) => ({ slug: u.slug, label: u.name.replace("REFIT ", "") }))];

export function GalleryGrid({ projects, initialFilter }: { projects: PublicGalleryProject[]; initialFilter?: string }) {
  const [active, setActive] = useState(filters.some((f) => f.slug === initialFilter) ? initialFilter! : "tous");
  const shown = active === "tous" ? projects : projects.filter((p) => p.univers === active);

  return (
    <div>
      <div role="group" aria-label="Filtrer par univers" className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const count = f.slug === "tous" ? projects.length : projects.filter((p) => p.univers === f.slug).length;
          return (
            <button
              key={f.slug}
              type="button"
              aria-pressed={active === f.slug}
              onClick={() => setActive(f.slug)}
              className={`rounded-full border px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
                active === f.slug ? "border-accent bg-accent text-ink" : "border-line text-paper/70 hover:border-paper/40"
              }`}
            >
              {f.label} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {shown.length ? (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {shown.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-sm border border-line bg-ink-2">
              <BeforeAfter before={p.before_url} after={p.after_url} alt={p.title} sizes="(min-width: 768px) 50vw, 100vw" />
              <div className="p-5">
                <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  REFIT {univers.find((u) => u.slug === p.univers)?.name.replace("REFIT ", "")}
                </p>
                <h2 className="mt-2 font-display text-lg font-semibold">{p.title}</h2>
                {p.city && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-paper/50">
                    <MapPin className="size-3.5" /> {p.city}
                  </p>
                )}
                {p.description && <p className="mt-3 text-sm leading-relaxed text-paper/70">{p.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-sm border border-dashed border-line bg-ink-2 p-8 text-paper/60">
          Les réalisations de cet univers arrivent bientôt.
        </p>
      )}
    </div>
  );
}
