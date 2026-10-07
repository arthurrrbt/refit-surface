import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Crée le chantier d'un devis signé (une seule fois) avec sa liste de matière :
 * pour chaque ligne « revêtement », les m² à commander pertes comprises.
 * Fonctionne avec le client gérant ou le client « clé secrète » (signature en ligne).
 */
export async function createJobFromQuote(db: SupabaseClient, quoteId: string): Promise<string> {
  const { data: existing } = await db.from("jobs").select("id").eq("quote_id", quoteId).maybeSingle();
  if (existing) return existing.id as string;

  const { data: quote, error } = await db
    .from("quotes")
    .select("id, title, univers, contact_id, lead_id, labour_days, contacts(address, postal_code, city), quote_lines(kind, product_id, description, quantity, details)")
    .eq("id", quoteId)
    .single();
  if (error || !quote) throw error ?? new Error("Devis introuvable");

  const q = quote as unknown as {
    id: string;
    title: string | null;
    univers: string | null;
    contact_id: string;
    lead_id: string | null;
    labour_days: number | null;
    contacts: { address: string | null; postal_code: string | null; city: string | null } | null;
    quote_lines: { kind: string; product_id: string | null; description: string; quantity: number; details: { purchased_m2?: number } }[];
  };
  const address = [q.contacts?.address, [q.contacts?.postal_code, q.contacts?.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  const { data: job, error: jobError } = await db
    .from("jobs")
    .insert({
      quote_id: q.id,
      lead_id: q.lead_id,
      contact_id: q.contact_id,
      univers: q.univers,
      title: q.title ?? "Chantier",
      address: address || null,
      labour_days: q.labour_days,
    })
    .select("id")
    .single();
  if (jobError) throw jobError;

  const materials = q.quote_lines
    .filter((l) => l.kind === "matiere")
    .map((l) => ({
      job_id: job.id,
      product_id: l.product_id,
      description: l.description,
      quantity_m2: Number(l.details?.purchased_m2 ?? l.quantity),
    }));
  if (materials.length) await db.from("job_materials").insert(materials);
  await db.from("quotes").update({ job_id: job.id }).eq("id", q.id);
  return job.id as string;
}
