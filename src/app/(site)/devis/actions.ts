"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { MAX_PHOTOS, PHOTO_EXTENSIONS, devisSchema, type DevisInput } from "@/lib/devis/schema";
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

  const email = d.email.toLowerCase();
  const now = new Date().toISOString();
  const contactFields = {
    kind: d.kind,
    company: d.company || null,
    first_name: d.firstName,
    last_name: d.lastName,
    email,
    phone: d.phone,
    postal_code: d.postalCode || null,
    city: d.city || null,
    privacy_consent_at: now,
  };

  try {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, marketing_consent")
      .eq("email", email)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let contactId: string;
    if (existing) {
      const { error } = await supabase
        .from("contacts")
        .update({ ...contactFields, marketing_consent: existing.marketing_consent || d.marketingConsent })
        .eq("id", existing.id);
      if (error) throw error;
      contactId = existing.id;
    } else {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ ...contactFields, marketing_consent: d.marketingConsent, source: "site" })
        .select("id")
        .single();
      if (error) throw error;
      contactId = data.id;
    }

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

  return { ok: true };
}
