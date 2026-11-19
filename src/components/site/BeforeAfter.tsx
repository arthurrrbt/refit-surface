"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { Loader2, MoveHorizontal } from "lucide-react";

/** Comparateur avant / après : glisser (souris ou doigt) ou flèches du clavier. */
export function BeforeAfter({
  before,
  after,
  alt,
  sizes,
  eager = false,
}: {
  /** URL (réalisations de la galerie) ou image importée (photos du site). */
  before: ImageProps["src"];
  after: ImageProps["src"];
  alt: string;
  sizes: string;
  /** Chargement immédiat (première image visible de la page). */
  eager?: boolean;
}) {
  const [position, setPosition] = useState(50);
  const [loaded, setLoaded] = useState(0);
  const ready = loaded >= 2;
  const onLoad = () => setLoaded((n) => n + 1);

  return (
    <div className="relative aspect-[4/3] touch-pan-y overflow-hidden bg-ink-2 select-none">
      <Image src={after} alt={`${alt} — après`} fill sizes={sizes} loading={eager ? "eager" : "lazy"} onLoad={onLoad} className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image src={before} alt={`${alt} — avant`} fill sizes={sizes} loading={eager ? "eager" : "lazy"} onLoad={onLoad} className="object-cover" />
      </div>

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-2/80" aria-hidden>
          <Loader2 className="size-6 animate-spin text-paper/50" />
        </div>
      )}

      <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-ink/75 px-2 py-1 font-display text-xs font-medium text-paper">
        Avant
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-paper px-2 py-1 font-display text-xs font-medium text-ink">
        Après
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-paper shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ left: `${position}%` }}>
        <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-ink shadow-lg">
          <MoveHorizontal className="size-5" />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`Comparer avant et après : ${alt}`}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
