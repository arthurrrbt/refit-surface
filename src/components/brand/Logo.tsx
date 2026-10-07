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
      <path
        fill="currentColor"
        d="M0 0H110A31 31 0 0 1 110 62H92L130 100H82L21 39H110A8 8 0 0 0 110 23H23Z"
      />
      <path fill="currentColor" d="M0 42V100H58Z" />
      <path className="fill-accent" d="M12 42H24L82 100H70Z" />
    </>
  );
}

/** Mot-symbole REFIT (R + EFIT), tracé en aplats pour rester net à toutes les tailles. */
export function Wordmark({ className, title = "REFIT" }: MarkProps) {
  return (
    <svg viewBox="0 0 545 100" className={className} role="img" aria-label={title}>
      <RGlyph />
      <g fill="currentColor">
        {/* E */}
        <path d="M157 0H249V23H182V38.5H243V61.5H182V77H249V100H157Z" />
        {/* F */}
        <path d="M265 0H355V23H290V38.5H347V61.5H290V100H265Z" />
        {/* I */}
        <rect x="371" y="0" width="26" height="100" />
        {/* T */}
        <path d="M413 0H525V23H482V100H456V23H413Z" />
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
  size?: "sm" | "md" | "lg";
  showSurface?: boolean;
  align?: "center" | "start";
};

const sizes = {
  sm: { mark: "h-5", surface: "text-[0.55rem] mt-1" },
  md: { mark: "h-7", surface: "text-[0.7rem] mt-1.5" },
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
