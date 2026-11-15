import { LOGO_PATHS } from "@/components/brand/logo-paths";
import { site } from "@/content/site";

/**
 * Page de maintenance autonome : HTML, styles et animation du logo en un seul fichier, sans police, script
 * ni image à charger. Elle s'affiche même quand le site, la base ou le serveur d'application ne répondent plus.
 * Servie par le site (mode MAINTENANCE_MODE) et par Caddy (fichier public/maintenance.html, voir README).
 */
export const MAINTENANCE_EMAIL = site.email;

const svg = `<svg viewBox="0 0 545 100" role="img" aria-label="REFIT">
  <g class="r" fill="currentColor">${LOGO_PATHS.rBody.map((d) => `<path d="${d}"/>`).join("")}</g>
  <path class="band" fill="#00b4ef" d="${LOGO_PATHS.rBand}"/>
  ${LOGO_PATHS.letters.map((d, i) => `<path class="l" style="animation-delay:${0.32 + i * 0.08}s" fill="currentColor" d="${d}"/>`).join("")}
</svg>`;

export const MAINTENANCE_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Maintenance en cours — ${site.name}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body {
    min-height: 100svh; display: grid; place-items: center; padding: 24px;
    background: #0d0e0f; color: #fff; text-align: center;
    font-family: Montserrat, "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
  }
  main { max-width: 34rem; }
  svg { width: min(78vw, 22rem); height: auto; color: #fff; overflow: visible; }
  .band { animation: band .6s cubic-bezier(.22,1,.36,1) .05s both; }
  .r { animation: fade .6s ease-out .18s both; }
  .l { animation: rise .65s cubic-bezier(.22,1,.36,1) both; }
  .surface { margin-top: 14px; font-size: 15px; letter-spacing: .32em; color: rgba(255,255,255,.8); animation: up .6s ease-out .72s both; }
  .rule { display: block; width: 64px; height: 2px; margin: 18px auto 0; background: #00b4ef; transform-origin: center;
    animation: grow .65s cubic-bezier(.22,1,.36,1) .85s both, pulse 2.4s ease-in-out 1.6s infinite; }
  h1 { margin-top: 44px; font-size: clamp(22px, 4vw, 30px); font-weight: 600; animation: up .7s ease-out 1.05s both; }
  p { margin-top: 14px; line-height: 1.6; color: rgba(255,255,255,.72); animation: up .7s ease-out 1.2s both; }
  a { color: #00b4ef; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(0,180,239,.4); }
  a:hover, a:focus-visible { border-bottom-color: #00b4ef; outline: none; }
  @keyframes band { from { opacity: 0; transform: translate(-36px,-30px); } }
  @keyframes fade { from { opacity: 0; } }
  @keyframes rise { from { opacity: 0; transform: translateY(34px); } }
  @keyframes up { from { opacity: 0; transform: translateY(10px); } }
  @keyframes grow { from { transform: scaleX(0); } }
  @keyframes pulse { 50% { transform: scaleX(1.8); opacity: .55; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }
</style>
</head>
<body>
<main>
  ${svg}
  <div class="surface">SURFACE</div>
  <span class="rule"></span>
  <h1>Site en cours de maintenance</h1>
  <p>Nous améliorons le site et revenons très vite.<br>Pour toute question, écrivez-nous à
  <a href="mailto:${MAINTENANCE_EMAIL}">${MAINTENANCE_EMAIL}</a>.</p>
</main>
</body>
</html>
`;

/** Réponse HTTP de maintenance : 503 « service temporairement indisponible » (Google garde le site en mémoire). */
export function maintenanceResponse(status = 503) {
  return new Response(MAINTENANCE_HTML, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": "1800",
      "X-Robots-Tag": "noindex",
    },
  });
}
