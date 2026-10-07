import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { UniversSlug } from "@/content/univers";
import { getPublishedProjects } from "@/lib/gallery";
import { BeforeAfter } from "./BeforeAfter";

/** Dernières réalisations publiées (rien n'est affiché tant qu'il n'y en a pas). */
export async function RecentProjects({ univers, limit = 2 }: { univers?: UniversSlug; limit?: number }) {
  const all = await getPublishedProjects();
  const projects = (univers ? all.filter((p) => p.univers === univers) : all).slice(0, limit);
  if (!projects.length) return null;

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Avant / après</p>
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Réalisations récentes</h2>
          </div>
          <Link
            href={univers ? `/realisations?univers=${univers}` : "/realisations"}
            className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] text-paper/80 hover:text-accent"
          >
            Toutes les réalisations <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-sm border border-line bg-ink-2">
              <BeforeAfter before={p.before_url} after={p.after_url} alt={p.title} sizes="(min-width: 768px) 50vw, 100vw" />
              <p className="p-4 font-display font-semibold">
                {p.title}
                {p.city && <span className="font-normal text-paper/50"> · {p.city}</span>}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
