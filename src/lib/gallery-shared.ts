// Types et utilitaires de la galerie, utilisables côté client comme côté serveur.

import { SUPABASE_URL } from "./env";

export type GalleryProject = {
  id: string;
  slug: string;
  title: string;
  univers: "home" | "glass" | "pro" | "boat";
  city: string | null;
  description: string | null;
  before_path: string | null;
  after_path: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export type PublicGalleryProject = Omit<GalleryProject, "before_path" | "after_path"> & {
  before_url: string;
  after_url: string;
};

export function galleryPublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/gallery/${path}`;
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
