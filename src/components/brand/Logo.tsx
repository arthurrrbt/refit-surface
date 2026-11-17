import { LOGO_PATHS } from "./logo-paths";

export { LOGO_PATHS };
type MarkProps = { className?: string; title?: string };

/** Monogramme « R » : la couleur suit `currentColor`, la bande reste en bleu accent. */
export function RMark({ className, title = "REFIT" }: MarkProps) {
  return (
    <svg viewBox="0 0 141 100" className={className} role="img" aria-label={title}>
      <RGlyph />
    </svg>
  );
}


function RGlyph() {
  return (
    <>
      {LOGO_PATHS.rBody.map((d) => (
        <path key={d} fill="currentColor" d={d} />
      ))}
      <path className="fill-accent" d={LOGO_PATHS.rBand} />
    </>
  );
}

/** Mot-symbole REFIT (R + EFIT), tracé en aplats pour rester net à toutes les tailles. */
export function Wordmark({ className, title = "REFIT" }: MarkProps) {
  return (
    <svg viewBox="0 0 545 100" className={className} role="img" aria-label={title}>
      <RGlyph />
      <g fill="currentColor">
        {LOGO_PATHS.letters.map((d) => (
          <path key={d} d={d} />
        ))}
        {/* ® */}
        <circle cx="537" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <text x="537" y="9.6" fontSize="7.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700">
          R
        </text>
      </g>
    </svg>
  );
}

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "header" | "lg";
  showSurface?: boolean;
  align?: "center" | "start";
};

const sizes = {
  sm: { mark: "h-5", surface: "text-[0.55rem] mt-1" },
  md: { mark: "h-7", surface: "text-[0.7rem] mt-1.5" },
  header: { mark: "h-8 sm:h-9", surface: "text-[0.7rem] sm:text-[0.8rem] mt-1.5" }, // bandeau du site

  lg: { mark: "h-16 sm:h-24", surface: "text-xl sm:text-3xl mt-3 sm:mt-4" },
};

/** Logo complet : REFIT + SURFACE en capitales espacées. */
export function Logo({ className = "", size = "md", showSurface = true, align = "center" }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex flex-col ${align === "start" ? "items-start" : "items-center"} ${className}`}>
      <Wordmark className={`${s.mark} w-auto`} title="REFIT Surface" />
      {showSurface && (
        <span
          aria-hidden
          className={`font-display font-light uppercase leading-none tracking-[0.42em] pl-[0.42em] ${s.surface}`}
        >
          Surface
        </span>
      )}
    </span>
  );
}
