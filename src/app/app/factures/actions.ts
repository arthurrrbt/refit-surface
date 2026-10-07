"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { addDays, parisDate } from "@/lib/booking/time";
import { creditedHt, getInvoice, type ClientSnapshot } from "@/lib/invoices/data";
import { renderInvoicePdf } from "@/lib/invoices/pdf";
import { invoiceTotals, type InvoiceLineInput } from "@/lib/invoices/totals";
import { getQuote } from "@/lib/quotes/data";
import { createClient } from "@/lib/supabase/server";

export type InvoiceActionState = { ok?: boolean; error?: string };

async function writeInvoiceLines(invoiceId: string, lines: InvoiceLineInput[], vatRate: number) {
  const supabase = await createClient();
  const { error: delError } = await supabase.from("invoice_lines").delete().eq("invoice_id", invoiceId);
  if (delError) throw delError;
  if (lines.length) {
    const { error } = await supabase.from("invoice_lines").insert(
      lines.map((l, position) => ({
        invoice_id: invoiceId,
        position,
        kind: l.kind,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price_ht: l.unit_price,
      })),
    );
    if (error) throw error;
  }
  const totals = invoiceTotals(lines, vatRate);
  const { error } = await supabase.from("invoices").update({ total_ht: totals.total_ht, total_ttc: totals.total_ttc }).eq("id", invoiceId);
  if (error) throw error;
  return totals;
}

/** Crée une facture brouillon (acompte, solde ou globale) à partir d'un devis signé. */
export async function createInvoiceFromQuote(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  await requireUser();
  const parsed = z
    .object({ quote_id: z.uuid(), kind: z.enum(["acompte", "solde", "globale"]) })
    .parse({ quote_id: formData.get("quote_id"), kind: formData.get("kind") });
  const quote = await getQuote(parsed.quote_id);
  if (!quote || quote.status !== "signe") return { error: "Seul un devis signé peut être facturé." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("invoices")
    .select("id, number, kind, status, total_ht")
    .eq("quote_id", quote.id)
    .neq("status", "annulee")
    .neq("kind", "avoir");
  const others = existing ?? [];

  if (parsed.kind === "acompte" && others.some((i) => i.kind === "acompte")) return { error: "Une facture d'acompte existe déjà pour ce devis." };
  if (parsed.kind !== "acompte" && others.some((i) => i.kind !== "acompte")) return { error: "Ce devis a déjà une facture de solde." };

  const quoteLines: InvoiceLineInput[] = quote.quote_lines.map((l) => ({
    kind: "libre",
    description: l.description,
    quantity: l.quantity,
    unit: l.unit,
    unit_price: l.unit_price_ht,
  }));

  let lines: InvoiceLineInput[];
  if (parsed.kind === "acompte") {
    const rate = quote.deposit_rate ?? 0.3;
    lines = [
      {
        kind: "acompte",
        description: `Acompte de ${Math.round(rate * 100)} % sur le devis ${quote.number} — ${quote.title ?? ""}`.trim(),
        quantity: 1,
        unit: "forfait",
        unit_price: Math.round(quote.total_ht * rate * 100) / 100,
      },
    ];
  } else if (parsed.kind === "solde") {
    const deposits = others.filter((i) => i.kind === "acompte" && i.status !== "brouillon");
    lines = [
      ...quoteLines,
      ...deposits.map((d) => ({
        kind: "deduction" as const,
        description: `Acompte facturé (${d.number}) — à déduire`,
        quantity: 1,
        unit: "forfait",
        unit_price: -d.total_ht,
      })),
    ];
  } else {
    lines = quoteLines;
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      kind: parsed.kind,
      title: quote.title,
      quote_id: quote.id,
      contact_id: quote.contact_id,
      vat_rate: quote.vat_rate,
    })
    .select("id")
    .single();
  if (error) return { error: "Création de la facture impossible." };
  await writeInvoiceLines(invoice.id, lines, quote.vat_rate);
  redirect(`/app/factures/${invoice.id}`);
}

const draftSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().max(200),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  notes: z.string().trim().max(2000),
  lines: z
    .array(
      z.object({
        kind: z.enum(["libre", "acompte", "deduction"]),
        description: z.string().trim().min(1, "Chaque ligne doit avoir une désignation.").max(300),
        quantity: z.number().min(-100000).max(100000),
        unit: z.string().max(20),
        unit_price: z.number().min(-1000000).max(1000000),
      }),
    )
    .max(80),
});

/** Enregistre une facture brouillon (montants recalculés côté serveur). */
export async function saveInvoiceDraft(input: z.input<typeof draftSchema>): Promise<InvoiceActionState & { total_ttc?: number }> {
  await requireUser();
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Facture invalide." };
  const { id, title, service_date, notes, lines } = parsed.data;
  const supabase = await createClient();
  const { data: invoice } = await supabase.from("invoices").select("status, vat_rate").eq("id", id).single();
  if (!invoice || invoice.status !== "brouillon") return { error: "Cette facture est déjà émise : elle ne peut plus être modifiée." };
  const { error } = await supabase
    .from("invoices")
    .update({ title: title || null, service_date: service_date || null, notes: notes || null })
    .eq("id", id);
  if (error) return { error: "Enregistrement impossible." };
  const totals = await writeInvoiceLines(id, lines, invoice.vat_rate);
  refresh();
  return { ok: true, total_ttc: totals.total_ttc };
}

/**
 * Émet la facture ou l'avoir : identité du client figée, échéance, numéro continu attribué par la base
 * (fonction emit_invoice, série F ou A), imputation des avoirs, PDF archivé et lien de téléchargement.
 */
export async function emitInvoice(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Facture invalide." };
  const invoice = await getInvoice(id.data);
  if (!invoice || invoice.status !== "brouillon") return { error: "Document introuvable ou déjà émis." };
  if (!invoice.invoice_lines.length) return { error: "Le document est vide." };

  const supabase = await createClient();
  const isCreditNote = invoice.kind === "avoir";
  let snapshot: ClientSnapshot;

  if (isCreditNote) {
    // Avoir : montant négatif, plafonné à ce qui reste créditable sur la facture d'origine
    if (invoice.total_ttc >= 0) return { error: "Le montant d'un avoir doit être négatif." };
    const { data: original } = await supabase
      .from("invoices")
      .select("id, status, total_ht, client_snapshot")
      .eq("id", invoice.credited_invoice_id!)
      .single();
    if (!original || original.status === "brouillon") return { error: "La facture d'origine est introuvable ou non émise." };
    const { data: others } = await supabase
      .from("invoices")
      .select("total_ht")
      .eq("credited_invoice_id", original.id)
      .neq("status", "brouillon");
    const already = (others ?? []).reduce((sum, o) => sum + Math.abs(Number(o.total_ht)), 0);
    if (Math.abs(invoice.total_ht) > Number(original.total_ht) - already + 0.005) {
      return { error: "L'avoir dépasse le montant restant de la facture d'origine." };
    }
    snapshot = original.client_snapshot as ClientSnapshot;
  } else {
    if (invoice.total_ttc <= 0) return { error: "Le montant de la facture doit être positif." };
    if (invoice.kind !== "acompte" && !invoice.service_date) return { error: "Indiquez la date de réalisation des travaux puis enregistrez." };
    const c = invoice.contacts;
    if (!c?.address || !c.city) return { error: "Adresse du client incomplète : complétez-la sur la fiche prospect." };
    const person = [c.first_name, c.last_name].filter(Boolean).join(" ");
    snapshot = {
      name: c.company ? `${c.company}${person ? ` — ${person}` : ""}` : person,
      company: c.company,
      kind: c.kind,
      address: c.address,
      postal_code: c.postal_code,
      city: c.city,
      email: c.email,
      siren: c.siret ? c.siret.replace(/\s/g, "").slice(0, 9) : null,
    };
    if (c.kind === "professionnel" && !snapshot.siren) return { error: "Client professionnel : indiquez son SIRET sur la fiche prospect (mention obligatoire)." };
  }

  const { data: settings } = await supabase.from("settings").select("invoice_due_days").single();
  const today = parisDate();
  const { error: prepError } = await supabase
    .from("invoices")
    .update({
      client_snapshot: snapshot,
      due_at: isCreditNote ? today : addDays(today, settings?.invoice_due_days ?? 0),
      share_token: randomBytes(24).toString("hex"),
    })
    .eq("id", invoice.id);
  if (prepError) return { error: "Préparation du document impossible." };

  const { error: emitError } = await supabase.rpc("emit_invoice", { p_invoice: invoice.id });
  if (emitError) return { error: `Émission impossible : ${emitError.message}` };

  if (isCreditNote) {
    // Imputation : l'avoir solde d'abord ce qui reste dû sur la facture d'origine, le surplus est à rembourser
    const originalId = invoice.credited_invoice_id!;
    const [{ data: original }, { data: otherCredits }] = await Promise.all([
      supabase.from("invoices").select("total_ttc, amount_paid").eq("id", originalId).single(),
      supabase.from("invoices").select("amount_imputed").eq("credited_invoice_id", originalId).neq("id", invoice.id).neq("status", "brouillon"),
    ]);
    const stillDue = original
      ? Number(original.total_ttc) - Number(original.amount_paid) - (otherCredits ?? []).reduce((sum, o) => sum + Number(o.amount_imputed), 0)
      : 0;
    const imputed = Math.round(Math.min(Math.abs(invoice.total_ttc), Math.max(stillDue, 0)) * 100) / 100;
    await supabase.from("invoices").update({ amount_imputed: imputed }).eq("id", invoice.id);
    await recomputeSettlement(invoice.id);
    await recomputeSettlement(originalId);
  }

  // PDF archivé (en cas d'échec, il est régénéré au téléchargement)
  try {
    const emitted = await getInvoice(invoice.id);
    if (emitted) {
      const pdf = await renderInvoicePdf(emitted);
      const path = `${isCreditNote ? "avoirs" : "factures"}/${emitted.number}.pdf`;
      const { error } = await supabase.storage.from("documents").upload(path, pdf, { contentType: "application/pdf", upsert: true });
      if (!error) await supabase.from("invoices").update({ pdf_path: path }).eq("id", invoice.id);
    }
  } catch (error) {
    console.error("emitInvoice PDF", error);
  }
  refresh();
  return { ok: true };
}

export async function deleteInvoiceDraft(formData: FormData) {
  await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("quote_id, credited_invoice_id").eq("id", id).eq("status", "brouillon").single();
  const { error } = await supabase.from("invoices").delete().eq("id", id).eq("status", "brouillon");
  if (error) throw error;
  redirect(data?.credited_invoice_id ? `/app/factures/${data.credited_invoice_id}` : data?.quote_id ? `/app/devis/${data.quote_id}` : "/app/factures");
}

/**
 * Recalcule encaissements et statut.
 * - Facture : payée si encaissements + avoirs imputés couvrent le TTC ; annulée si les avoirs couvrent tout.
 * - Avoir : soldé si la part imputée + les remboursements couvrent son montant.
 */
async function recomputeSettlement(invoiceId: string) {
  const supabase = await createClient();
  const [{ data: payments }, { data: inv }, { data: credits }] = await Promise.all([
    supabase.from("invoice_payments").select("amount, paid_on").eq("invoice_id", invoiceId),
    supabase.from("invoices").select("kind, status, total_ttc, amount_imputed").eq("id", invoiceId).single(),
    supabase.from("invoices").select("total_ttc, amount_imputed").eq("credited_invoice_id", invoiceId).neq("status", "brouillon"),
  ]);
  if (!inv || inv.status === "brouillon") return;

  const paid = Math.round((payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0) * 100) / 100;
  const total = Number(inv.total_ttc);
  let status: "emise" | "payee" | "annulee";
  if (inv.kind === "avoir") {
    status = Number(inv.amount_imputed) + paid >= Math.abs(total) - 0.005 ? "payee" : "emise";
  } else {
    const creditTotal = (credits ?? []).reduce((sum, c) => sum + Math.abs(Number(c.total_ttc)), 0);
    const imputed = (credits ?? []).reduce((sum, c) => sum + Number(c.amount_imputed), 0);
    status = creditTotal >= total - 0.005 ? "annulee" : paid + imputed >= total - 0.005 ? "payee" : "emise";
  }
  const lastPayment = (payments ?? []).map((p) => p.paid_on).sort().pop();
  await supabase
    .from("invoices")
    .update({ amount_paid: paid, status, paid_at: status === "payee" ? `${lastPayment ?? parisDate()}T12:00:00Z` : null })
    .eq("id", invoiceId);
}

const creditSchema = z.object({
  invoice_id: z.uuid(),
  mode: z.enum(["total", "partiel"]),
  amount_ht: z.preprocess((v) => (v === "" || v == null ? undefined : String(v).replace(",", ".")), z.coerce.number().positive().optional()),
  motif: z.string().trim().min(3, "Indiquez le motif de l'avoir.").max(500),
});

/** Prépare un avoir (brouillon) sur une facture émise : total (toutes les lignes en négatif) ou partiel. */
export async function createCreditNote(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  await requireUser();
  const parsed = creditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Avoir invalide." };
  const { invoice_id, mode, amount_ht, motif } = parsed.data;

  const original = await getInvoice(invoice_id);
  if (!original || original.kind === "avoir") return { error: "Facture introuvable." };
  if (original.status === "brouillon" || original.status === "annulee") return { error: "Seule une facture émise et non annulée peut faire l'objet d'un avoir." };
  if (original.credit_notes?.some((n) => n.status === "brouillon")) return { error: "Un avoir est déjà en préparation pour cette facture." };

  const already = creditedHt(original.credit_notes);
  const creditable = Math.round((original.total_ht - already) * 100) / 100;
  if (creditable <= 0) return { error: "Cette facture est déjà entièrement créditée." };

  let lines: InvoiceLineInput[];
  if (mode === "total") {
    if (already > 0) return { error: `Des avoirs existent déjà : établissez un avoir partiel (au plus ${creditable.toFixed(2)} € HT).` };
    lines = original.invoice_lines.map((l) => ({ kind: "libre", description: l.description, quantity: l.quantity, unit: l.unit, unit_price: -l.unit_price_ht }));
  } else {
    if (!amount_ht) return { error: "Indiquez le montant HT de l'avoir." };
    if (amount_ht > creditable + 0.005) return { error: `Montant trop élevé : au plus ${creditable.toFixed(2)} € HT.` };
    lines = [{ kind: "libre", description: `Avoir sur la facture ${original.number} — ${motif}`, quantity: 1, unit: "forfait", unit_price: -amount_ht }];
  }

  const supabase = await createClient();
  const { data: note, error } = await supabase
    .from("invoices")
    .insert({
      kind: "avoir",
      credited_invoice_id: original.id,
      quote_id: original.quote_id,
      contact_id: original.contact_id,
      vat_rate: original.vat_rate,
      title: `Avoir sur la facture ${original.number}`,
      notes: `Motif : ${motif}`,
      service_date: original.service_date,
    })
    .select("id")
    .single();
  if (error) return { error: "Création de l'avoir impossible." };
  await writeInvoiceLines(note.id, lines, original.vat_rate);
  redirect(`/app/factures/${note.id}`);
}

const paymentSchema = z.object({
  invoice_id: z.uuid(),
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  amount: z.coerce.number().refine((n) => n !== 0, "Montant invalide."),
  method: z.enum(["virement", "cheque", "especes", "carte", "autre"]),
  reference: z.string().trim().max(100).optional(),
});

export async function addPayment(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  await requireUser();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Encaissement invalide." };
  const supabase = await createClient();
  const { data: invoice } = await supabase.from("invoices").select("status").eq("id", parsed.data.invoice_id).single();
  if (!invoice || invoice.status === "brouillon") return { error: "Émettez la facture avant d'enregistrer un paiement." };
  const { error } = await supabase.from("invoice_payments").insert({ ...parsed.data, reference: parsed.data.reference || null });
  if (error) return { error: "Enregistrement impossible." };
  await recomputeSettlement(parsed.data.invoice_id);
  refresh();
  return { ok: true };
}

export async function deletePayment(formData: FormData) {
  await requireUser();
  const parsed = z.object({ id: z.uuid(), invoice_id: z.uuid() }).parse({ id: formData.get("id"), invoice_id: formData.get("invoice_id") });
  const supabase = await createClient();
  await supabase.from("invoice_payments").delete().eq("id", parsed.id);
  await recomputeSettlement(parsed.invoice_id);
  refresh();
}

/** Marque la facture comme envoyée au client (date d'envoi). */
export async function markInvoiceSent(formData: FormData) {
  await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("invoices").update({ sent_at: new Date().toISOString() }).eq("id", id).neq("status", "brouillon");
  refresh();
}

