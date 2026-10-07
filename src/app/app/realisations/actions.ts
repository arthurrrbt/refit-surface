"use server";

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { GALLERY_TAG } from "@/lib/gallery";
import { slugify } from "@/lib/gallery-shared";
import { createClient } from "@/lib/supabase/server";

const photoPath = z
  .string()
  .regex(/^projets\/[a-z0-9-]+\/(avant|apres)-\d+\.(jpg|jpeg|png|webp)$/)
  .nullable();

const projectSchema = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(3, "Titre trop court.").max(120),
    univers: z.enum(["home", "glass", "pro", "boat"]),
    city: z.string().trim().max(80).optional(),
    description: z.string().trim().max(1500).optional(),
    before_path: photoPath,
    after_path: photoPath,
    published: z.boolean(),
    clientConsent: z.boolean(),
  })
  .refine((p) => !p.published || (p.before_path && p.after_path), {
    message: "Ajoutez les photos avant et après pour publier.",
  })
  .refine((p) => !p.published || p.clientConsent, {
    message: "Confirmez avoir obtenu l'accord du client avant de publier ses photos.",
  });

export type SaveProjectInput = z.input<typeof projectSchema>;
export type SaveProjectResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveProject(input: SaveProjectInput): Promise<SaveProjectResult> {
  await requireUser();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { id, clientConsent: _consent, ...p } = parsed.data;
  void _consent;
  const supabase = await createClient();

  const fields = {
    title: p.title,
    univers: p.univers,
    city: p.city || null,
    description: p.description || null,
    before_path: p.before_path,
    after_path: p.after_path,
    published: p.published,
  };

  if (id) {
    const { data: current } = await supabase
      .from("gallery_projects")
      .select("published_at, before_path, after_path")
      .eq("id", id)
      .single();
    const { error } = await supabase
      .from("gallery_projects")
      .update({ ...fields, published_at: p.published ? (current?.published_at ?? new Date().toISOString()) : null })
      .eq("id", id);
    if (error) return { ok: false, error: "Enregistrement impossible." };
    // Supprime les anciennes photos remplacées
    const replaced = [current?.before_path, current?.after_path].filter(
      (path): path is string => Boolean(path) && path !== p.before_path && path !== p.after_path,
    );
    if (replaced.length) await supabase.storage.from("gallery").remove(replaced);
    updateTag(GALLERY_TAG);
    return { ok: true, id };
  }

  const slug = `${slugify(p.title) || "realisation"}-${randomBytes(3).toString("hex")}`;
  const { data, error } = await supabase
    .from("gallery_projects")
    .insert({ ...fields, slug, published_at: p.published ? new Date().toISOString() : null })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Enregistrement impossible." };
  updateTag(GALLERY_TAG);
  return { ok: true, id: data.id };
}

export async function deleteProject(formData: FormData) {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { data: project } = await supabase.from("gallery_projects").select("before_path, after_path").eq("id", id.data).single();
  const { error } = await supabase.from("gallery_projects").delete().eq("id", id.data);
  if (error) throw error;
  const files = [project?.before_path, project?.after_path].filter(Boolean) as string[];
  if (files.length) await supabase.storage.from("gallery").remove(files);
  updateTag(GALLERY_TAG);
  redirect("/app/realisations");
}
