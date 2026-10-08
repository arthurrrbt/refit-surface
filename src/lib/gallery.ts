import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { galleryPublicUrl, type GalleryProject, type PublicGalleryProject } from "./gallery-shared";

export const GALLERY_TAG = "gallery";

/** Réalisations publiées, mises en cache (invalidées à chaque modification dans le back-office). */
export async function getPublishedProjects(): Promise<PublicGalleryProject[]> {
  "use cache";
  cacheTag(GALLERY_TAG);
  cacheLife("hours");

  const env = getSupabaseEnv();
  if (!env) return [];
  // Client anonyme sans cookies : la RLS n'expose que les réalisations publiées
  const supabase = createSupabaseClient(env.url, env.key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("gallery_projects")
    // Colonnes publiques uniquement (l'anonyme n'a pas accès à job_id)
    .select("id, slug, title, univers, city, description, before_path, after_path, published, published_at, created_at")
    .eq("published", true)
    .not("before_path", "is", null)
    .not("after_path", "is", null)
    .order("published_at", { ascending: false });
  if (error) {
    console.error("getPublishedProjects", error);
    return [];
  }
  return (data as GalleryProject[]).map(({ before_path, after_path, ...p }) => ({
    ...p,
    before_url: galleryPublicUrl(before_path!),
    after_url: galleryPublicUrl(after_path!),
  }));
}

/** Toutes les réalisations (back-office). */
export async function listProjects(): Promise<GalleryProject[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_projects").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as GalleryProject[];
}

export async function getProject(id: string): Promise<GalleryProject | null> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as GalleryProject | null;
}
