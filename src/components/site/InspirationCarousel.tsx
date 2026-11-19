import Image from "next/image";
import Link from "next/link";
import { inspirations } from "@/content/media";

import { AutoScroll } from "./AutoScroll";

/**
 * Carrousel : défile tout seul en continu, en ligne droite, et se fait glisser au doigt ou au trackpad
 * (voir AutoScroll). Le survol ne l'arrête pas.
 * La liste est affichée deux fois pour boucler sans fin ; la copie est masquée aux lecteurs d'écran.
 */
export function InspirationCarousel() {
  const card = (item: (typeof inspirations)[number], i: number, copy: boolean) => (
    <li key={`${copy ? "b" : "a"}-${i}`} aria-hidden={copy || undefined} className="shrink-0">
      <Link
        href={`/${item.univers}`}
        tabIndex={copy ? -1 : undefined}
        className="group block w-60 sm:w-72"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-[0_30px_50px_-30px_rgba(0,0,0,0.9)]">
          <Image
            src={item.src}
            alt={copy ? "" : item.alt}
            fill
            sizes="(min-width: 640px) 288px, 240px"
            placeholder="blur"
            className="object-cover"
          />
        </div>
        <p className="mt-3 text-sm text-paper/75 transition-colors group-hover:text-paper">
          {item.label}
        </p>
      </Link>
    </li>
  );

  return (
    <AutoScroll label="Inspirations : faites glisser pour parcourir">
      <ul className="flex w-max gap-6 px-4 py-6 sm:px-6">
        {inspirations.map((item, i) => card(item, i, false))}
        {inspirations.map((item, i) => card(item, i, true))}
      </ul>
    </AutoScroll>
  );
}
