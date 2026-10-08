import { Fragment, type CSSProperties } from "react";

// Lignes qui ondulent derrière le titre de l'accueil : un film qui se déroule sur une surface.
// Adapté de « Background Paths » (framer-motion) en SVG + CSS pur : aucun JavaScript côté navigateur,
// durées fixes (pas d'aléatoire → rendu identique serveur / navigateur), animation coupée si l'utilisateur
// a demandé moins d'animations (voir .hero-path dans globals.css).

const COUNT = 32;
// Le cadre (viewBox) englobe toute la courbe, pour que les lignes traversent tout l'écran

function paths(position: 1 | -1) {
  return Array.from({ length: COUNT }, (_, i) => {
    const s = i * 5 * position;
    return {
      id: i,
      d: `M-${380 - s} -${189 + i * 6}C-${380 - s} -${189 + i * 6} -${312 - s} ${216 - i * 6} ${152 - s} ${343 - i * 6}C${616 - s} ${470 - i * 6} ${684 - s} ${875 - i * 6} ${684 - s} ${875 - i * 6}`,
      width: 0.5 + i * 0.03,
      opacity: 0.05 + i * 0.012,
      // Un fil sur huit en bleu REFIT
      accent: i % 8 === 5,
      // Durées et départs variés mais déterministes
      duration: 20 + ((i * 7) % 11),
      delay: -((i * 13) % 20),
      dash: 0.3 + ((i * 3) % 4) * 0.1,
    };
  });
}

function PathLayer({ position }: { position: 1 | -1 }) {
  return (
    <svg className="absolute inset-0 size-full" viewBox="-520 -300 1300 1000" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden>
      {paths(position).map((p) => (
        <path
          key={p.id}
          d={p.d}
          pathLength={1}
          stroke="currentColor"
          strokeWidth={p.width}
          className={`hero-path ${p.accent ? "text-accent" : "text-paper"}`}
          style={
            {
              "--o": p.accent ? Math.min(0.9, p.opacity * 2) : p.opacity,
              "--dash": p.dash,
              animationDuration: `${p.duration}s, ${p.duration}s`,
              animationDelay: `${p.delay}s, ${p.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}

export function HeroPaths() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <PathLayer position={1} />
      <PathLayer position={-1} />
    </div>
  );
}

/** Titre révélé lettre à lettre, une seule fois au chargement ; lu d'un bloc par les lecteurs d'écran. */
export function RevealTitle({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  const starts = words.map((_, w) => words.slice(0, w).join("").length); // rang de la 1re lettre de chaque mot
  return (
    <h1 className={className} aria-label={text}>
      {words.map((word, w) => (
        <Fragment key={w}>
          {w > 0 && " "}
          <span aria-hidden className="inline-block whitespace-nowrap">
            {word.split("").map((letter, l) => (
              <span key={l} className="hero-letter inline-block" style={{ animationDelay: `${(w * 0.1 + (starts[w] + l) * 0.03).toFixed(2)}s` }}>
                {letter}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </h1>
  );
}
