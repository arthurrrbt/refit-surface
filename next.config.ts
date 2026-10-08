import type { NextConfig } from "next";

// Photos de la galerie servies par le stockage public Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
const isDev = process.env.NODE_ENV !== "production";

/**
 * Politique de sécurité du contenu. 'unsafe-inline' pour les scripts reste nécessaire aux scripts
 * d'amorçage de Next.js sans nonce (un nonce rendrait toutes les pages dynamiques) ; le reste est verrouillé :
 * aucune ressource tierce hors Supabase, aucun plugin, aucun cadre (anti-clickjacking), formulaires vers le site seulement.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin}${isDev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Serveur autonome (.next/standalone) pour l'hébergement sur VPS
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // CSP sur les pages, pas sur les PDF (le lecteur PDF du navigateur la supporte mal)
      { source: "/:path((?!.*/pdf$|facture/).*)", headers: [{ key: "Content-Security-Policy", value: csp }] },
    ];
  },
  // Développement : autorise un téléphone du réseau local (ex. http://192.168.1.104:3000)
  allowedDevOrigins: ["192.168.1.*"],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/gallery/**`)] : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
