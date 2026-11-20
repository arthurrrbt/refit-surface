import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { finishGroups, type Finish } from "@/content/finishes";

/**
 * « Les finitions » : les familles Cover Styl' (surfaces) puis Solar Screen (vitrages), l'une sous l'autre.
 * Chaque tuile montre une mise en situation et mène à la page de l'univers concerné.
 */
export function FinishesSection() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <p className="eyebrow">Les finitions</p>
        <h2 className="mt-3 max-w-3xl font-display text-2xl font-medium tracking-tight sm:text-4xl">
          Des centaines de teintes, choisies avec vous sur échantillons
        </h2>

        <div className="mt-14 space-y-20">
          {finishGroups.map((group) => (
            <div key={group.key}>
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-6">
                <div className="max-w-2xl">
                  <p className="text-sm text-stone">{group.brand}</p>
                  <h3 className="mt-1 font-display text-xl font-medium sm:text-2xl">{group.title}</h3>
                  <p className="mt-2 leading-relaxed text-paper/65">{group.text}</p>
                </div>
                <Link
                  href={group.link.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-paper/80 transition-colors hover:text-accent"
                >
                  {group.link.label} <ArrowRight className="size-4" strokeWidth={1.5} />
                </Link>
              </div>

              <ul className={`mt-8 grid grid-cols-2 gap-x-4 gap-y-8 ${group.key === "cover-styl" ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
                {group.items.map((item, i) => (
                  // Solar Screen : la première famille (Argent) occupe deux colonnes, pour 2 rangées pleines de 4
                  <li key={item.name} className={group.key === "solar-screen" && i === 0 ? "col-span-2" : undefined}>
                    <FinishTile item={item} wide={group.key === "solar-screen" && i === 0} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-paper/45">Visuels : Cover Styl&apos; et Solar Screen. Nombre de références des gammes fabricants.</p>
      </div>
    </section>
  );
}

function FinishTile({ item, wide }: { item: Finish; wide: boolean }) {
  return (
    <Link href={item.href} className="group block">
      {/* Tuile large (2 colonnes + l'espace de 1rem entre elles) à la même hauteur qu'une tuile 4/3 :
          hauteur = 3/4 × (largeur − 1rem) / 2 = 37,5 % de la largeur − 0,375rem (padding-top en % = % de la largeur) */}
      <div className={`relative overflow-hidden rounded-xl bg-ink-2 ${wide ? "h-0 pt-[calc(37.5%-0.375rem)]" : "aspect-[4/3]"}`}>
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes={wide ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 20vw, 50vw"}
          placeholder="blur"
          className="object-cover transition-[scale] duration-700 group-hover:scale-105"
        />
      </div>
      <p className="mt-3 font-display font-medium leading-snug">{item.name}</p>
      <p className="mt-1 text-sm leading-snug text-paper/65">{item.text}</p>
      {item.count != null && <p className="mt-1 text-xs text-stone">{item.count} références</p>}
    </Link>
  );
}
