import type { CSSProperties } from "react";

// Lignes qui ondulent derrière le titre de l'accueil : un film qui se déroule sur une surface.
// Fluidité : les lignes ne sont jamais redessinées. Chaque nappe dérive d'un bloc (transform, calculé par
// la carte graphique) ; seuls quelques reflets bleus courts glissent le long des fils, toujours dans le même sens.
// Tout s'arrête si le visiteur a demandé moins d'animations (voir « Accueil » dans globals.css).

const COUNT = 28;

function curves(position: 1 | -1) {
  return Array.from({ length: COUNT }, (_, i) => {
    const s = i * 5 * position;
    return {
      id: i,
      d: `M-${380 - s} -${189 + i * 6}C-${380 - s} -${189 + i * 6} -${312 - s} ${216 - i * 6} ${152 - s} ${343 - i * 6}C${616 - s} ${470 - i * 6} ${684 - s} ${875 - i * 6} ${684 - s} ${875 - i * 6}`,
      width: 0.5 + i * 0.03,
      opacity: 0.05 + i * 0.011,
      comet: i % 7 === 4, // fils parcourus par un reflet bleu
    };
  });
}

// Le cadre englobe toute la courbe, pour que les lignes traversent tout l'écran
const VIEWBOX = "-520 -300 1300 1000";

function Layer({ position, className }: { position: 1 | -1; className: string }) {
  return (
    <div className={`absolute -inset-[8%] ${className}`}>
      <svg className="size-full text-paper" viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden>
        {curves(position).map((c) => (
          <path key={c.id} d={c.d} stroke="currentColor" strokeWidth={c.width} strokeOpacity={c.opacity} />
        ))}
      </svg>
    </div>
  );
}

function Comets() {
  const comets = ([1, -1] as const).flatMap((position) => curves(position).filter((c) => c.comet).map((c) => ({ ...c, position })));
  return (
    <div className="absolute -inset-[8%] hero-drift-a">
      <svg className="size-full text-accent" viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden>
        {comets.map((c, k) => (
          <path
            key={`${c.position}-${c.id}`}
            d={c.d}
            pathLength={1}
            stroke="currentColor"
            strokeWidth={c.width + 0.6}
            strokeLinecap="round"
            className="hero-comet"
            style={{ animationDuration: `${11 + ((k * 5) % 7)}s`, animationDelay: `-${(k * 3.7) % 11}s` } as CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}

export function HeroPaths() {
  return (
    <div className="hero-lines pointer-events-none absolute inset-0 overflow-hidden">
      <Layer position={1} className="hero-drift-a" />
      <Layer position={-1} className="hero-drift-b" />
      <Comets />
    </div>
  );
}
