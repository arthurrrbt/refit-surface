"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { MAX_PHOTOS, PHOTO_EXTENSIONS, devisSchema, type DevisInput } from "@/lib/devis/schema";
import { runQualification } from "@/lib/agents/qualification";
import { upsertContact } from "@/lib/contacts";
import { galleryPublicUrl } from "@/lib/gallery-shared";
import { devisConfirmationEmail, type ExampleProject } from "@/lib/mail/devis-confirmation";
import { sendMail } from "@/lib/mail/send";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "lead-photos";

type UploadSlots = { uploadId: string; slots: { path: string; token: string }[] } | { error: string };

/** Réserve des emplacements d'envoi signés : les photos partent directement du navigateur vers le stockage. */
export async function prepareDevisUpload(extensions: string[]): Promise<UploadSlots> {
  const parsed = z
    .array(z.enum(PHOTO_EXTENSIONS))
    .min(1)
    .max(MAX_PHOTOS)
    .safeParse(extensions.map((e) => e.toLowerCase()));
  if (!parsed.success) return { error: "Format de photo non accepté (JPEG, PNG, WebP ou HEIC)." };

  const uploadId = randomUUID();
  const storage = createAdminClient().storage.from(BUCKET);
  const results = await Promise.all(
    parsed.data.map((ext, i) => storage.createSignedUploadUrl(`site/${uploadId}/${i + 1}.${ext}`)),
  );
  if (results.some((r) => r.error || !r.data)) {
    console.error("prepareDevisUpload", results.find((r) => r.error)?.error);
    return { error: "L'envoi de photos est momentanément indisponible." };
  }
  return { uploadId, slots: results.map((r) => ({ path: r.data!.path, token: r.data!.token })) };
}

type SubmitResult = { ok: true } | { ok: false; error: string };

/** Enregistre la demande : contact (dédupliqué par e-mail), prospect et photos. */
export async function submitDevis(input: DevisInput): Promise<SubmitResult> {
  const parsed = devisSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  }
  const d = parsed.data;

  // Robot : on fait comme si tout s'était bien passé
  if (d.website) return { ok: true };

  const supabase = createAdminClient();

  // Ne garder que les photos réellement déposées dans le dossier de cet envoi
  let photoPaths: string[] = [];
  if (d.uploadId && d.photos.length) {
    const folder = `site/${d.uploadId}`;
    const { data: files } = await supabase.storage.from(BUCKET).list(folder);
    const uploaded = new Set((files ?? []).map((f) => `${folder}/${f.name}`));
    photoPaths = d.photos.filter((p) => uploaded.has(p));
  }

  let leadId: string;
  try {
    const contactId = await upsertContact(supabase, d);

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        contact_id: contactId,
        univers: d.univers,
        source: "site",
        message: d.message || null,
        surfaces: d.surfaces.map((s) => ({
          type: s.type,
          largeur_mm: s.largeurCm ? Math.round(s.largeurCm * 10) : null,
          hauteur_mm: s.hauteurCm ? Math.round(s.hauteurCm * 10) : null,
          quantite: s.quantite,
        })),
        details: { objectifs: d.objectifs, finitions: d.finitions || null, delai: d.delai || null },
      })
      .select("id")
      .single();
    if (leadError) throw leadError;
    leadId = lead.id;

    if (photoPaths.length) {
      const { error } = await supabase
        .from("lead_photos")
        .insert(photoPaths.map((storage_path) => ({ lead_id: lead.id, storage_path })));
      if (error) throw error;
    }
  } catch (error) {
    console.error("submitDevis", error);
    return { ok: false, error: "Votre demande n'a pas pu être enregistrée. Réessayez ou appelez-nous." };
  }

  // Adresse du site telle que vue par le visiteur (liens de l'e-mail valides en test comme en production)
  const h = await headers();
  const origin = `https://${h.get("x-forwarded-host") ?? h.get("host")}`.replace("https://localhost", "http://localhost");

  after(async () => {
    // E-mail de confirmation au client (récapitulatif + exemple de réalisation)
    const mail = await sendDevisConfirmation(d, photoPaths.length, origin);
    if (!mail.ok) console.warn(`Confirmation devis ${leadId} : ${mail.error}`);
    // Analyse IA de la demande
    const result = await runQualification(leadId);
    if (!result.ok) console.warn(`Qualification ${leadId} : ${result.error}`);
  });

  return { ok: true };
}

/** Envoie le récapitulatif au client, au plus 3 fois par adresse et par 24 h (anti-abus). */
async function sendDevisConfirmation(d: DevisInput, photoCount: number, origin: string) {
  const db = createAdminClient();
  const email = d.email.toLowerCase();
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await db
    .from("leads")
    .select("id, contacts!inner(email)", { count: "exact", head: true })
    .eq("contacts.email", email)
    .gte("created_at", since);
  if ((count ?? 0) > 3) return { ok: false as const, error: "limite de 3 confirmations par 24 h atteinte" };

  // Réalisation publiée la plus récente du même univers, à défaut la plus récente tout court
  const pick = async (univers?: string) => {
    let q = db
      .from("gallery_projects")
      .select("title, city, before_path, after_path")
      .eq("published", true)
      .not("before_path", "is", null)
      .not("after_path", "is", null)
      .order("published_at", { ascending: false })
      .limit(1);
    if (univers) q = q.eq("univers", univers);
    const { data } = await q.maybeSingle();
    return data;
  };
  const project = (await pick(d.univers)) ?? (await pick());
  const example: ExampleProject | null = project
    ? { title: project.title, city: project.city, beforeUrl: galleryPublicUrl(project.before_path!), afterUrl: galleryPublicUrl(project.after_path!) }
    : null;

  const { subject, html, text } = devisConfirmationEmail(d, photoCount, origin, example);
  return sendMail({ to: email, subject, html, text });
}
