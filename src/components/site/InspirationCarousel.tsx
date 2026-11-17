import Image from "next/image";
import Link from "next/link";
import { inspirations } from "@/content/media";

/**
 * Carrousel « flottant » : la bande défile en continu (CSS uniquement, aucun JavaScript),
 * se met en pause au survol ou au clavier, et devient un simple défilement manuel
 * si le visiteur a demandé moins d'animations (styles .marquee dans globals.css).
 * La liste est affichée deux fois pour boucler sans saut ; la copie est masquée aux lecteurs d'écran.
 */
export function InspirationCarousel() {
  const card = (item: (typeof inspirations)[number], i: number, copy: boolean) => (
    <li
      key={`${copy ? "b" : "a"}-${i}`}
      aria-hidden={copy || undefined}
      className="marquee-float shrink-0"
      style={{ animationDelay: `${-(i % 4) * 1.5}s` }}
    >
      <Link
        href={`/${item.univers}`}
        tabIndex={copy ? -1 : undefined}
        className="group block w-60 sm:w-72"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-[0_30px_50px_-30px_rgba(0,0,0,0.9)]">
          <Image
            src={item.src}
            alt={copy ? "" : item.alt}
            fill
            sizes="(min-width: 640px) 288px, 240px"
            placeholder="blur"
            className="object-cover transition-[scale] duration-700 group-hover:scale-105"
          />
        </div>
        <p className="mt-3 font-display text-xs font-semibold uppercase tracking-[0.2em] text-paper/80 group-hover:text-accent">
          {item.label}
        </p>
      </Link>
    </li>
  );

  return (
    <div className="marquee overflow-hidden">
      <ul className="marquee-track flex w-max gap-6 px-4 py-6 sm:px-6">
        {inspirations.map((item, i) => card(item, i, false))}
        {inspirations.map((item, i) => card(item, i, true))}
      </ul>
    </div>
  );
}
