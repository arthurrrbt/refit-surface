import type { MetadataRoute } from "next";

// L'application installable est le back-office (utilisation sur chantier).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "REFIT Surface — Gestion",
    short_name: "REFIT",
    description: "Prospects, devis, factures et planning chantier REFIT Surface.",
    lang: "fr",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0e0f",
    theme_color: "#0d0e0f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
