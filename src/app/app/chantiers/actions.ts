"use server";

import { randomBytes } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { addDays, parisToUtc, weekday } from "@/lib/booking/time";
import { GALLERY_TAG } from "@/lib/gallery";
import { slugify } from "@/lib/gallery-shared";
import { createJobFromQuote } from "@/lib/jobs/create";
import { createClient } from "@/lib/supabase/server";

export type JobActionState = { ok?: boolean; error?: string };

/** Crée le chantier d'un devis signé (bouton « Créer le chantier »). */
export async function createJob(formData: FormData) {
  await requireUser();
  const quoteId = z.uuid().parse(formData.get("quote_id"));
  const supabase = await createClient();
  const { data: quote } = await supabase.from("quotes").select("status").eq("id", quoteId).single();
  if (quote?.status !== "signe") throw new Error("Seul un devis signé peut devenir un chantier.");
  const jobId = await createJobFromQuote(supabase, quoteId);
  redirect(`/app/chantiers/${jobId}`);
}

const scheduleSchema = z
  .object({
    id: z.uuid(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide."),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide."),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    saturday: z.string().optional(),
  })
  .refine((s) => s.end_date >= s.start_date, { message: "La fin doit être après le début." })
  .refine((s) => s.end_time > s.start_time, { message: "L'heure de fin doit être après l'heure de début." });

/** Planifie la pose : un créneau au planning par jour ouvré (bloque les rendez-vous en ligne). */
export async function scheduleJob(_prev: JobActionState, formData: FormData): Promise<JobActionState> {
  await requireUser();
  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dates invalides." };
  const s = parsed.data;

  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id, title, address, status, lead_id").eq("id", s.id).single();
  if (!job) return { error: "Chantier introuvable." };

  const days: string[] = [];
  for (let d = s.start_date; d <= s.end_date && days.length < 60; d = addDays(d, 1)) {
    const wd = weekday(d);
    if (wd === 0 || (wd === 6 && !s.saturday)) continue; // dimanche, et samedi sauf choix contraire
    days.push(d);
  }
  if (!days.length) return { error: "Aucun jour ouvré dans cette période." };

  await supabase.from("events").delete().eq("job_id", job.id).eq("kind", "pose");
  const { error } = await supabase.from("events").insert(
    days.map((d, i) => ({
      kind: "pose",
      title: `Pose — ${job.title}${days.length > 1 ? ` (jour ${i + 1}/${days.length})` : ""}`,
      starts_at: parisToUtc(d, s.start_time).toISOString(),
      ends_at: parisToUtc(d, s.end_time).toISOString(),
      job_id: job.id,
      lead_id: job.lead_id,
      location: job.address,
    })),
  );
  if (error) return { error: "Ajout au planning impossible." };

  await supabase
    .from("jobs")
    .update({ start_date: days[0], end_date: days[days.length - 1], status: job.status === "a_planifier" ? "planifie" : job.status })
    .eq("id", job.id);
  refresh();
  return { ok: true };
}

/** Démarre ou termine le chantier. */
export async function setJobStatus(formData: FormData) {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(["en_cours", "termine", "planifie"]) })
    .parse({ id: formData.get("id"), status: formData.get("status") });
  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase
    .from("jobs")
    .update({
      status: parsed.status,
      ...(parsed.status === "en_cours" ? { started_at: now } : {}),
      ...(parsed.status === "termine" ? { finished_at: now } : {}),
    })
    .eq("id", parsed.id);
  refresh();
}

/** Avance le statut d'une ligne de matière : à commander → commandé → reçu. */
export async function setMaterialStatus(formData: FormData) {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(["a_commander", "commande", "recu"]) })
    .parse({ id: formData.get("id"), status: formData.get("status") });
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: material } = await supabase
    .from("job_materials")
    .update({
      status: parsed.status,
      ordered_at: parsed.status === "a_commander" ? null : now,
      received_at: parsed.status === "recu" ? now : null,
    })
    .eq("id", parsed.id)
    .select("job_id")
    .single();
  if (material && parsed.status !== "a_commander") {
    await supabase.from("jobs").update({ materials_ordered_at: now }).eq("id", material.job_id).is("materials_ordered_at", null);
  }
  refresh();
}

/** Enregistre les photos déposées par le navigateur dans le stockage privé. */
export async function registerJobPhotos(jobId: string, stage: "avant" | "pendant" | "apres", paths: string[]): Promise<JobActionState> {
  await requireUser();
  const parsed = z
    .object({
      jobId: z.uuid(),
      stage: z.enum(["avant", "pendant", "apres"]),
      paths: z.array(z.string().regex(/^chantiers\/[0-9a-f-]{36}\/(avant|pendant|apres)-\d+-\d+\.(jpg|jpeg|png|webp)$/)).min(1).max(20),
    })
    .safeParse({ jobId, stage, paths });
  if (!parsed.success) return { error: "Photos invalides." };
  if (!parsed.data.paths.every((p) => p.startsWith(`chantiers/${parsed.data.jobId}/`))) return { error: "Photos invalides." };
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("lead_id").eq("id", jobId).single();
  const { error } = await supabase
    .from("lead_photos")
    .insert(parsed.data.paths.map((storage_path) => ({ job_id: jobId, lead_id: job?.lead_id ?? null, stage, storage_path })));
  if (error) return { error: "Enregistrement des photos impossible." };
  refresh();
  return { ok: true };
}

export async function deleteJobPhoto(formData: FormData) {
  await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data: photo } = await supabase.from("lead_photos").select("storage_path, job_id").eq("id", id).single();
  if (!photo?.job_id) return;
  await supabase.from("lead_photos").delete().eq("id", id);
  await supabase.storage.from("lead-photos").remove([photo.storage_path]);
  refresh();
}

export async function saveJobNotes(_prev: JobActionState, formData: FormData): Promise<JobActionState> {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), notes: z.string().trim().max(5000), address: z.string().trim().max(300) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Notes invalides." };
  const supabase = await createClient();
  await supabase.from("jobs").update({ notes: parsed.data.notes || null, address: parsed.data.address || null }).eq("id", parsed.data.id);
  refresh();
  return { ok: true };
}

/**
 * Prépare la réalisation de la galerie : copie la photo avant et la photo après
 * (stockage privé → galerie publique) et crée un brouillon à relire avant publication.
 */
export async function publishJobToGallery(_prev: JobActionState, formData: FormData): Promise<JobActionState> {
  await requireUser();
  const parsed = z
    .object({ job_id: z.uuid(), before_id: z.uuid("Choisissez la photo avant."), after_id: z.uuid("Choisissez la photo après.") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choisissez une photo avant et une photo après." };

  const supabase = await createClient();
  const [{ data: job }, { data: photos }] = await Promise.all([
    supabase.from("jobs").select("id, title, univers, contacts(city)").eq("id", parsed.data.job_id).single(),
    supabase.from("lead_photos").select("id, storage_path").eq("job_id", parsed.data.job_id).in("id", [parsed.data.before_id, parsed.data.after_id]),
  ]);
  if (!job) return { error: "Chantier introuvable." };
  const before = photos?.find((p) => p.id === parsed.data.before_id);
  const after = photos?.find((p) => p.id === parsed.data.after_id);
  if (!before || !after) return { error: "Photos introuvables." };

  const stamp = Date.now();
  const ext = (p: string) => p.split(".").pop() ?? "jpg";
  const beforePath = `projets/${job.id}/avant-${stamp}.${ext(before.storage_path)}`;
  const afterPath = `projets/${job.id}/apres-${stamp}.${ext(after.storage_path)}`;
  const storage = supabase.storage.from("lead-photos");
  const [c1, c2] = await Promise.all([
    storage.copy(before.storage_path, beforePath, { destinationBucket: "gallery" }),
    storage.copy(after.storage_path, afterPath, { destinationBucket: "gallery" }),
  ]);
  if (c1.error || c2.error) return { error: "Copie des photos vers la galerie impossible." };

  const city = (job.contacts as unknown as { city: string | null } | null)?.city ?? null;
  const { data: project, error } = await supabase
    .from("gallery_projects")
    .insert({
      slug: `${slugify(job.title) || "realisation"}-${randomBytes(3).toString("hex")}`,
      title: job.title,
      univers: job.univers ?? "home",
      city,
      before_path: beforePath,
      after_path: afterPath,
      job_id: job.id,
      published: false,
    })
    .select("id")
    .single();
  if (error) return { error: "Création de la réalisation impossible." };
  updateTag(GALLERY_TAG);
  redirect(`/app/realisations/${project.id}`);
}
