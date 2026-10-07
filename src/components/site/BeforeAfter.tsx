"use client";

import Image from "next/image";
import { useState } from "react";
import { MoveHorizontal } from "lucide-react";

/** Comparateur avant / après : glisser (souris ou doigt) ou flèches du clavier. */
export function BeforeAfter({ before, after, alt, sizes }: { before: string; after: string; alt: string; sizes: string }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative aspect-[4/3] touch-pan-y overflow-hidden bg-ink-2 select-none">
      <Image src={after} alt={`${alt} — après`} fill sizes={sizes} className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image src={before} alt={`${alt} — avant`} fill sizes={sizes} className="object-cover" />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-ink/75 px-2 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-paper">
        Avant
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-sm bg-accent px-2 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink">
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
