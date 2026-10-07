import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { univers } from "@/content/univers";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", ...univers.map((u) => `/${u.slug}`), "/realisations", "/devis", "/rendez-vous", "/contact"];
  return pages.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
