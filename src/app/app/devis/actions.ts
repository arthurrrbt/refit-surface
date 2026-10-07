"use server";

import { createHash, randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parisDate, addDays } from "@/lib/booking/time";
import { getQuote } from "@/lib/quotes/data";
import { renderQuotePdf } from "@/lib/quotes/pdf";
import { computeLine, computeTotals, type LineInput, type PricingSettings, type Product, type QuoteTotals } from "@/lib/quotes/pricing";
import { createClient } from "@/lib/supabase/server";

const universTitles: Record<string, string> = {
  home: "Rénovation cuisine / mobilier par revêtement adhésif",
  glass: "Pose de films pour vitrages",
  pro: "Rénovation de surfaces — établissement professionnel",
  boat: "Rénovation intérieure de bateau",
};

/** Crée un devis brouillon à partir d'un prospect, pré-rempli avec ses surfaces. */
export async function createQuoteFromLead(formData: FormData) {
  await requireUser();
  const leadId = z.uuid().parse(formData.get("lead_id"));
  const supabase = await createClient();
  const [{ data: lead }, { data: settings }] = await Promise.all([
    supabase.from("leads").select("id, contact_id, univers, surfaces").eq("id", leadId).single(),
    supabase.from("settings").select("*").single(),
  ]);
  if (!lead || !settings) throw new Error("Prospect ou paramètres introuvables.");
  const s = settings as PricingSettings;

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      lead_id: lead.id,
      contact_id: lead.contact_id,
      univers: lead.univers,
      title: universTitles[lead.univers ?? ""] ?? "Rénovation de surfaces",
      vat_rate: s.vat_rate,
      deposit_rate: s.deposit_rate,
    })
    .select("id")
    .single();
  if (error) throw error;

  // Une ligne « revêtement » par surface déclarée, puis main d'œuvre et déplacement
  const surfaces = (lead.surfaces ?? []) as { type: string; largeur_mm: number | null; hauteur_mm: number | null; quantite: number }[];
  const inputs: LineInput[] = [
    ...surfaces.map((sf) => ({
      kind: "matiere" as const,
      product_id: "",
      description: sf.type,
      surface_m2: sf.largeur_mm && sf.hauteur_mm ? Math.round(((sf.largeur_mm * sf.hauteur_mm * sf.quantite) / 1_000_000) * 100) / 100 : 0,
    })),
    { kind: "main_oeuvre", description: "", days: 1 },
    ...(s.travel_fee > 0 ? [{ kind: "deplacement" as const, description: "", amount: s.travel_fee }] : []),
  ];
  await writeLines(quote.id, inputs, s, new Map());
  redirect(`/app/devis/${quote.id}`);
}

const lineSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("matiere"), product_id: z.string(), description: z.string().max(300), surface_m2: z.number().min(0).max(100000) }),
  z.object({ kind: z.literal("main_oeuvre"), description: z.string().max(300), days: z.number().min(0).max(1000) }),
  z.object({ kind: z.literal("deplacement"), description: z.string().max(300), amount: z.number().min(0).max(100000) }),
  z.object({
    kind: z.literal("libre"),
    description: z.string().min(1).max(300),
    quantity: z.number().min(0).max(100000),
    unit: z.string().max(20),
    unit_price: z.number().min(-100000).max(100000),
  }),
]);

const saveSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().max(200),
  notes: z.string().trim().max(3000),
  lines: z.array(lineSchema).max(60),
});

export type SaveQuoteResult = { ok: true; totals: QuoteTotals } | { ok: false; error: string };

async function writeLines(quoteId: string, inputs: LineInput[], settings: PricingSettings, products: Map<string, Product>) {
  const supabase = await createClient();
  const computed = inputs.map((l) => computeLine(l, products, settings));
  const { data: quote } = await supabase.from("quotes").select("vat_rate, deposit_rate").eq("id", quoteId).single();
  const totals = computeTotals(computed, quote?.vat_rate ?? settings.vat_rate, quote?.deposit_rate ?? settings.deposit_rate);

  const { error: delError } = await supabase.from("quote_lines").delete().eq("quote_id", quoteId);
  if (delError) throw delError;
  if (computed.length) {
    const { error } = await supabase.from("quote_lines").insert(
      computed.map((l, position) => ({
        quote_id: quoteId,
        position,
        kind: l.kind,
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price_ht: l.unit_price_ht,
        cost_ht: l.cost_ht,
        details: l.details,
      })),
    );
    if (error) throw error;
  }
  const { error } = await supabase
    .from("quotes")
    .update({ total_ht: totals.total_ht, total_ttc: totals.total_ttc, total_cost_ht: totals.cost_ht, labour_days: totals.labour_days })
    .eq("id", quoteId);
  if (error) throw error;
  return totals;
}

/** Enregistre le contenu d'un devis brouillon ; les montants sont recalculés côté serveur. */
export async function saveQuote(input: z.input<typeof saveSchema>): Promise<SaveQuoteResult> {
  await requireUser();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Devis invalide." };
  const { id, title, notes, lines } = parsed.data;

  const supabase = await createClient();
  const [{ data: quote }, { data: settings }, { data: products }] = await Promise.all([
    supabase.from("quotes").select("status").eq("id", id).single(),
    supabase.from("settings").select("*").single(),
    supabase.from("products").select("*"),
  ]);
  if (!quote) return { ok: false, error: "Devis introuvable." };
  if (quote.status !== "brouillon") return { ok: false, error: "Ce devis a déjà été envoyé : repassez-le en brouillon pour le modifier." };

  const { error } = await supabase.from("quotes").update({ title: title || null, notes: notes || null }).eq("id", id);
  if (error) return { ok: false, error: "Enregistrement impossible." };
  const totals = await writeLines(
    id,
    lines as LineInput[],
    settings as PricingSettings,
    new Map(((products ?? []) as Product[]).map((p) => [p.id, p])),
  );
  refresh();
  return { ok: true, totals };
}

/**
 * Émet le devis : numéro définitif, dates, PDF figé dans le stockage, empreinte SHA-256
 * et lien de signature personnel. Le devis n'est plus modifiable ensuite.
 */
export async function sendQuote(formData: FormData) {
  await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const [{ data: current }, { data: settings }] = await Promise.all([
    supabase.from("quotes").select("status, number, total_ht").eq("id", id).single(),
    supabase.from("settings").select("quote_validity_days").single(),
  ]);
  if (!current || current.status !== "brouillon") return;
  if (!current.total_ht) throw new Error("Le devis est vide.");

  let number = current.number as string | null;
  if (!number) {
    const { data, error } = await supabase.rpc("next_document_number", { p_kind: "devis" });
    if (error) throw error;
    number = data as string;
  }
  const today = parisDate();
  await supabase
    .from("quotes")
    .update({ number, issued_at: today, valid_until: addDays(today, settings?.quote_validity_days ?? 30) })
    .eq("id", id);

  const quote = await getQuote(id);
  if (!quote) throw new Error("Devis introuvable.");
  const pdf = await renderQuotePdf(quote);
  const path = `devis/${number}.pdf`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;

  const { error } = await supabase
    .from("quotes")
    .update({
      status: "envoye",
      sent_at: new Date().toISOString(),
      pdf_path: path,
      pdf_sha256: createHash("sha256").update(pdf).digest("hex"),
      sign_token: randomBytes(24).toString("hex"),
    })
    .eq("id", id);
  if (error) throw error;
  if (quote.lead_id) await supabase.from("leads").update({ status: "devis_envoye" }).eq("id", quote.lead_id).in("status", ["nouveau", "qualifie", "rdv"]);
  refresh();
}

/** Repasse un devis envoyé (non signé) en brouillon : le lien de signature est désactivé. */
export async function reopenQuote(formData: FormData) {
  await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .update({ status: "brouillon", sign_token: null, pdf_sha256: null })
    .eq("id", id)
    .in("status", ["envoye", "refuse", "expire"]);
  refresh();
}

export async function markQuoteRefused(formData: FormData) {
  await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("quotes").update({ status: "refuse", sign_token: null }).eq("id", id).eq("status", "envoye");
  refresh();
}
