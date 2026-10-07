"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { MAX_PHOTOS, PHOTO_EXTENSIONS, devisSchema, type DevisInput } from "@/lib/devis/schema";
import { runQualification } from "@/lib/agents/qualification";
import { upsertContact } from "@/lib/contacts";
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

  // L'agent Qualification analyse la demande une fois la réponse envoyée au visiteur
  after(async () => {
    const result = await runQualification(leadId);
    if (!result.ok) console.warn(`Qualification ${leadId} : ${result.error}`);
  });

  return { ok: true };
}
