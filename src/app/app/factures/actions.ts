"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { addDays, parisDate } from "@/lib/booking/time";
import { getInvoice, type ClientSnapshot } from "@/lib/invoices/data";
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
    .neq("status", "annulee");
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
 * Émet la facture : identité du client figée, échéance, numéro continu attribué par la base
 * (fonction emit_invoice), PDF archivé et lien de téléchargement pour le client.
 */
export async function emitInvoice(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Facture invalide." };
  const invoice = await getInvoice(id.data);
  if (!invoice || invoice.status !== "brouillon") return { error: "Facture introuvable ou déjà émise." };
  if (!invoice.invoice_lines.length || invoice.total_ttc === 0) return { error: "La facture est vide." };
  if (invoice.kind !== "acompte" && !invoice.service_date) return { error: "Indiquez la date de réalisation des travaux puis enregistrez." };

  const c = invoice.contacts;
  if (!c?.address || !c.city) return { error: "Adresse du client incomplète : complétez-la sur la fiche prospect." };
  const person = [c.first_name, c.last_name].filter(Boolean).join(" ");
  const snapshot: ClientSnapshot = {
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

  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("invoice_due_days").single();
  const today = parisDate();
  const { error: prepError } = await supabase
    .from("invoices")
    .update({
      client_snapshot: snapshot,
      due_at: addDays(today, settings?.invoice_due_days ?? 0),
      share_token: randomBytes(24).toString("hex"),
    })
    .eq("id", invoice.id);
  if (prepError) return { error: "Préparation de la facture impossible." };

  const { error: emitError } = await supabase.rpc("emit_invoice", { p_invoice: invoice.id });
  if (emitError) return { error: `Émission impossible : ${emitError.message}` };

  // PDF archivé (en cas d'échec, il est régénéré au téléchargement)
  try {
    const emitted = await getInvoice(invoice.id);
    if (emitted) {
      const pdf = await renderInvoicePdf(emitted);
      const path = `factures/${emitted.number}.pdf`;
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
  const { data } = await supabase.from("invoices").select("quote_id").eq("id", id).eq("status", "brouillon").single();
  const { error } = await supabase.from("invoices").delete().eq("id", id).eq("status", "brouillon");
  if (error) throw error;
  redirect(data?.quote_id ? `/app/devis/${data.quote_id}` : "/app/factures");
}

async function recomputePaid(invoiceId: string) {
  const supabase = await createClient();
  const [{ data: payments }, { data: invoice }] = await Promise.all([
    supabase.from("invoice_payments").select("amount, paid_on").eq("invoice_id", invoiceId),
    supabase.from("invoices").select("total_ttc").eq("id", invoiceId).single(),
  ]);
  const paid = Math.round((payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0) * 100) / 100;
  const settled = invoice != null && paid >= invoice.total_ttc;
  const lastPayment = (payments ?? []).map((p) => p.paid_on).sort().pop();
  await supabase
    .from("invoices")
    .update({ amount_paid: paid, status: settled ? "payee" : "emise", paid_at: settled && lastPayment ? `${lastPayment}T12:00:00Z` : null })
    .eq("id", invoiceId)
    .neq("status", "brouillon");
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
  await recomputePaid(parsed.data.invoice_id);
  refresh();
  return { ok: true };
}

export async function deletePayment(formData: FormData) {
  await requireUser();
  const parsed = z.object({ id: z.uuid(), invoice_id: z.uuid() }).parse({ id: formData.get("id"), invoice_id: formData.get("invoice_id") });
  const supabase = await createClient();
  await supabase.from("invoice_payments").delete().eq("id", parsed.id);
  await recomputePaid(parsed.invoice_id);
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

