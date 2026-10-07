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
 * Crée ou met à jour le contact d'un formulaire public (dédupliqué par e-mail)
 * et horodate le consentement RGPD. Retourne l'identifiant du contact.
 */
export async function upsertContact(db: ReturnType<typeof createAdminClient>, input: ContactInput, source = "site") {
  const email = input.email.toLowerCase();
  const fields = {
    kind: input.kind,
    company: input.company || null,
    first_name: input.firstName,
    last_name: input.lastName,
    email,
    phone: input.phone,
    postal_code: input.postalCode || null,
    city: input.city || null,
    ...(input.address ? { address: input.address } : {}),
    privacy_consent_at: new Date().toISOString(),
  };

  const { data: existing } = await db
    .from("contacts")
    .select("id, marketing_consent")
    .eq("email", email)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("contacts")
      .update({ ...fields, marketing_consent: existing.marketing_consent || input.marketingConsent })
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id as string;
  }

  const { data, error } = await db
    .from("contacts")
    .insert({ ...fields, marketing_consent: input.marketingConsent, source })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}
