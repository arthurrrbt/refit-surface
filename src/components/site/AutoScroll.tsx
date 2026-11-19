"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Zone de défilement horizontal qui avance toute seule, en continu, et que l'on peut aussi faire glisser
 * au doigt, à la souris (molette horizontale) ou au trackpad. Le survol ne l'arrête pas.
 *
 * Boucle infinie : l'enfant (la piste) contient la liste deux fois, la copie marquée aria-hidden.
 * Quand on dépasse le début de la copie, on recule exactement d'une longueur de liste : invisible à l'œil.
 *
 * L'avance automatique laisse la main pendant un geste (doigt posé, glissé au trackpad, élan après le
 * geste) pour ne pas « tirer » contre le visiteur, puis reprend aussitôt. Elle est coupée si le visiteur
 * a demandé moins d'animations, et pendant la navigation au clavier (carte sélectionnée).
 */
export function AutoScroll({ children, speed = 60, label }: { children: ReactNode; speed?: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;
    let carry = 0; // fraction de pixel accumulée (le défilement se fait au pixel près)
    let touching = false;
    let holdUntil = 0;

    // Longueur d'une liste = écart entre la première carte et la première carte de la copie
    const loopWidth = () => {
      const track = el.firstElementChild as HTMLElement | null;
      const copy = track?.querySelector<HTMLElement>(":scope > [aria-hidden]");
      const first = track?.firstElementChild as HTMLElement | null;
      return copy && first ? copy.offsetLeft - first.offsetLeft : 0;
    };
    const wrap = () => {
      const w = loopWidth();
      if (!w) return;
      // Fenêtre [start, start + w) placée au centre de la piste : il reste toujours de la marge pour glisser
      // vers la gauche comme vers la droite. Deux positions séparées de w montrent exactement la même image.
      const start = Math.max(0, Math.min(w / 2, el.scrollWidth - el.clientWidth - w));
      if (el.scrollLeft < start) el.scrollLeft += w;
      else if (el.scrollLeft >= start + w) el.scrollLeft -= w;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      // Bouclage d'abord : arrivé au tout début (geste vers la gauche), on revient au milieu avant d'avancer
      if (!touching) wrap();
      const paused = reduce.matches || touching || now < holdUntil || el.matches(":has(:focus-visible)");
      if (!paused) {
        carry += (speed * dt) / 1000;
        const step = Math.floor(carry);
        if (step > 0) {
          el.scrollLeft += step;
          carry -= step;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const hold = (ms: number) => () => {
      holdUntil = performance.now() + ms;
    };
    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      holdUntil = performance.now() + 700; // laisse finir l'élan du geste
    };
    // Trackpad / molette horizontale : on laisse le geste mener, puis l'avance reprend
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) hold(400)();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    wrap(); // part du milieu : on peut tout de suite glisser dans les deux sens
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
}
