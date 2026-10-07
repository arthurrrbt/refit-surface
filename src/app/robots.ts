import type { MetadataRoute } from "next";
import { site } from "@/content/site";

// Avant le lancement (entreprise non immatriculée, mentions à compléter) : site fermé à tous les robots.
// Après le lancement : moteurs de recherche ET agents IA autorisés (choix du gérant), espaces privés exclus.
export default function robots(): MetadataRoute.Robots {
  if (!site.launched) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/connexion", "/signature", "/facture", "/api"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
