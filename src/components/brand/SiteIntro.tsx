import { LOGO_PATHS } from "./Logo";

/**
 * Exécuté avant le premier affichage : joue l'ouverture une seule fois par visite (mémoire de session),
 * jamais si le visiteur a demandé moins d'animations. Sans JavaScript, rien ne s'affiche (le site n'est jamais bloqué).
 */
const DECIDE = `try{var d=document.documentElement,k="refit-intro";if(sessionStorage.getItem(k)||matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("intro-skip")}else{sessionStorage.setItem(k,"1");d.classList.add("intro-play")}}catch(e){}`;

/**
 * Ouverture du site avec le logo REFIT : la bande bleue glisse, le R apparaît, E-F-I-T montent l'une après
 * l'autre, puis « SURFACE » et le trait bleu ; le logo s'efface et l'écran s'ouvre en deux comme un rideau.
 * Uniquement des transformations et des opacités (calculées par la carte graphique) : voir « Ouverture » dans globals.css.
 */
export function SiteIntro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DECIDE }} />
      <div className="site-intro" aria-hidden>
        <div className="site-intro__panel site-intro__panel--top" />
        <div className="site-intro__panel site-intro__panel--bottom" />
        <div className="site-intro__logo">
          <svg viewBox="0 0 545 100" className="h-16 w-auto text-paper sm:h-24">
            <g className="intro-rbody" fill="currentColor">
              {LOGO_PATHS.rBody.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <path className="intro-band fill-accent" d={LOGO_PATHS.rBand} />
            {LOGO_PATHS.letters.map((d, i) => (
              <path key={d} className="intro-letter" fill="currentColor" d={d} style={{ animationDelay: `${0.32 + i * 0.08}s` }} />
            ))}
          </svg>
          <span className="site-intro__surface font-display text-base tracking-(--tracking-brand) text-paper/80 sm:text-xl">SURFACE</span>
          <span className="site-intro__rule" />
        </div>
      </div>
    </>
  );
}
