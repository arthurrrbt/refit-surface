import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

export type ContactInput = {
  kind: "particulier" | "professionnel";
  company?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postalCode?: string;
  city?: string;
  address?: string;
  marketingConsent: boolean;
};

/**
 * Crée le contact d'un formulaire public, ou retrouve celui qui a déjà cet e-mail.
 * Sécurité : un formulaire public n'écrase JAMAIS une fiche existante — sinon quiconque connaît
 * l'e-mail d'un client pourrait remplacer son téléphone ou son adresse dans le CRM. On ne fait que
 * compléter les champs vides ; les coordonnées saisies sont gardées sur la demande (submittedContact)
 * et le gérant voit les différences sur la fiche prospect. Retourne l'identifiant du contact.
 */
export async function upsertContact(db: ReturnType<typeof createAdminClient>, input: ContactInput, source = "site") {
  const email = input.email.toLowerCase();
  // Date à laquelle la personne a reçu l'information RGPD (mention sous le formulaire) — ce n'est pas un consentement
  const privacy_consent_at = new Date().toISOString();
  const fields = {
    company: input.company || null,
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    postal_code: input.postalCode || null,
    city: input.city || null,
    address: input.address || null,
  };

  const { data: existing } = await db
    .from("contacts")
    .select("id, marketing_consent, company, first_name, last_name, phone, postal_code, city, address")
    .eq("email", email)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const update: Record<string, unknown> = { privacy_consent_at };
    for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
      if (!existing[key] && fields[key]) update[key] = fields[key];
    }
    if (input.marketingConsent && !existing.marketing_consent) update.marketing_consent = true;
    const { error } = await db.from("contacts").update(update).eq("id", existing.id);
    if (error) throw error;
    return existing.id as string;
  }

  const { data, error } = await db
    .from("contacts")
    .insert({ ...fields, kind: input.kind, email, privacy_consent_at, marketing_consent: input.marketingConsent, source })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export type SubmittedContact = {
  kind: string;
  company: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  postal_code: string | null;
  city: string | null;
  address: string | null;
};

/** Coordonnées telles que saisies dans la demande, conservées sur le prospect (details.contact_saisi). */
export function submittedContact(input: ContactInput): SubmittedContact {
  return {
    kind: input.kind,
    company: input.company || null,
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    postal_code: input.postalCode || null,
    city: input.city || null,
    address: input.address || null,
  };
}
