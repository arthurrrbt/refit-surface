"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Video } from "@/content/media";
import { VideoReel } from "./VideoReel";

/**
 * Carrousel de vidéos verticales : défilement au doigt (aimanté sur chaque vidéo) ou avec les flèches.
 * Chaque vidéo ne se lance que lorsqu'elle est visible : celles hors du cadre restent à l'arrêt et ne se téléchargent pas.
 */
export function VideoCarousel({ items }: { items: Video[] }) {
  const track = useRef<HTMLUListElement>(null);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * step, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow = "flex size-11 items-center justify-center rounded-md border border-paper/25 text-paper transition-colors hover:border-paper/60 hover:bg-paper/5";

  return (
    <div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => scroll(-1)} aria-label="Vidéo précédente" className={arrow}>
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="Vidéo suivante" className={arrow}>
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      <ul
        ref={track}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:thin]"
        aria-label="Vidéos de pose"
      >
        {items.map((v) => (
          <li key={v.src} className="w-[70vw] max-w-[17rem] shrink-0 snap-start sm:w-64">
            <VideoReel video={v} />
          </li>
        ))}
      </ul>
    </div>
  );
}
