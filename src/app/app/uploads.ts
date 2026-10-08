"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Emplacements d'envoi signés pour les photos du back-office. Le navigateur n'a ainsi jamais besoin
 * de la session Supabase (cookie de session HttpOnly, illisible par un script).
 * Chaque chemin est validé ici : impossible de viser un autre espace de stockage ou un autre dossier.
 */
const targets = {
  chantier: { bucket: "lead-photos", pattern: /^chantiers\/[0-9a-f-]{36}\/(avant|pendant|apres)-\d+-\d+\.(jpg|jpeg|png|webp)$/ },
  realisation: { bucket: "gallery", pattern: /^projets\/[a-z0-9-]+\/(avant|apres)-\d+\.(jpg|jpeg|png|webp)$/ },
} as const;

export type AdminUploadSlot = { bucket: string; path: string; token: string } | { error: string };

export async function prepareAdminUpload(target: keyof typeof targets, path: string): Promise<AdminUploadSlot> {
  await requireUser();
  const t = Object.hasOwn(targets, target) ? targets[target] : null;
  if (!t || typeof path !== "string" || !t.pattern.test(path)) return { error: "Emplacement de photo invalide." };
  // Sans « upsert » : un emplacement signé ne peut pas écraser un fichier existant
  const { data, error } = await createAdminClient().storage.from(t.bucket).createSignedUploadUrl(path);
  if (error || !data) return { error: "Envoi de photo momentanément indisponible." };
  return { bucket: t.bucket, path: data.path, token: data.token };
}
