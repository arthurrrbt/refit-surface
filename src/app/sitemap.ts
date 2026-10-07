import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { univers } from "@/content/univers";

export default function sitemap(): MetadataRoute.Sitemap {
  const main = ["", ...univers.map((u) => `/${u.slug}`), "/realisations", "/devis", "/rendez-vous", "/contact"];
  const legal = ["/mentions-legales", "/confidentialite", "/cgv"];
  return [
    ...main.map((path) => ({ url: `${site.url}${path}`, changeFrequency: "monthly" as const, priority: path === "" ? 1 : 0.8 })),
    ...legal.map((path) => ({ url: `${site.url}${path}`, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
