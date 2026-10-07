import "server-only";
import { requireUser } from "@/lib/auth";
import { parisDate } from "@/lib/booking/time";
import { createClient } from "@/lib/supabase/server";

export type InvoiceStatus = "brouillon" | "emise" | "transmise" | "payee" | "annulee";
export type InvoiceKind = "acompte" | "solde" | "globale" | "avoir";

export const invoiceKindLabels: Record<InvoiceKind, string> = {
  acompte: "Facture d'acompte",
  solde: "Facture de solde",
  globale: "Facture",
  avoir: "Avoir",
};

export type ClientSnapshot = {
  name: string;
  company: string | null;
  kind: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  email: string | null;
  siren: string | null;
};

export type InvoiceLineRow = {
  id: string;
  position: number;
  kind: "libre" | "acompte" | "deduction";
  description: string;
  quantity: number;
  unit: string;
  unit_price_ht: number;
  total_ht: number;
};

export type InvoicePayment = { id: string; paid_on: string; amount: number; method: string; reference: string | null };

/** Facture d'origine d'un avoir, ou avoir lié à une facture. */
export type RelatedInvoice = {
  id: string;
  number: string | null;
  kind: InvoiceKind;
  status: InvoiceStatus;
  issued_at: string | null;
  total_ht: number;
  total_ttc: number;
  amount_paid: number;
  amount_imputed: number;
};

export type InvoiceRow = {
  id: string;
  number: string | null;
  kind: InvoiceKind;
  title: string | null;
  quote_id: string | null;
  contact_id: string;
  credited_invoice_id: string | null;
  status: InvoiceStatus;
  issued_at: string | null;
  due_at: string | null;
  service_date: string | null;
  total_ht: number;
  vat_rate: number;
  total_ttc: number;
  amount_paid: number;
  amount_imputed: number;
  notes: string | null;
  operation_category: string;
  client_snapshot: ClientSnapshot | null;
  share_token: string | null;
  sent_at: string | null;
  paid_at: string | null;
  pdf_path: string | null;
  created_at: string;
  contacts: {
    kind: string;
    company: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    siret: string | null;
  } | null;
  quotes: { number: string | null; title: string | null } | null;
  invoice_lines: InvoiceLineRow[];
  invoice_payments: InvoicePayment[];
  /** Avoir : facture corrigée. */
  original?: RelatedInvoice | null;
  /** Facture : avoirs émis ou en préparation. */
  credit_notes?: RelatedInvoice[];
};

export const INVOICE_SELECT =
  "*, contacts(kind, company, first_name, last_name, email, phone, address, postal_code, city, siret), quotes(number, title), invoice_lines(*), invoice_payments(*)";

const RELATED_FIELDS = "id, number, kind, status, issued_at, total_ht, total_ttc, amount_paid, amount_imputed";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Solde d'un document.
 * - Facture : reste à payer = TTC − encaissements − avoirs imputés.
 * - Avoir : reste à rembourser = montant de l'avoir − part imputée − remboursements.
 */
export function invoiceBalance(
  inv: Pick<InvoiceRow, "status" | "total_ttc" | "amount_paid" | "due_at"> & { kind?: InvoiceKind; amount_imputed?: number },
  creditsImputed = 0,
) {
  const open = inv.status === "emise" || inv.status === "transmise";
  if (inv.kind === "avoir") {
    const remaining = round2(Math.abs(inv.total_ttc) - (inv.amount_imputed ?? 0) - inv.amount_paid);
    return { remaining, overdue: false };
  }
  const remaining = round2(inv.total_ttc - inv.amount_paid - creditsImputed);
  const overdue = open && remaining > 0 && inv.due_at != null && inv.due_at < parisDate();
  return { remaining, overdue };
}

/** Montant déjà crédité (HT) par les avoirs émis d'une facture. */
export function creditedHt(creditNotes: RelatedInvoice[] = []) {
  return round2(creditNotes.filter((c) => c.status !== "brouillon").reduce((sum, c) => sum + Math.abs(c.total_ht), 0));
}

export async function listInvoices() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, kind, title, status, total_ttc, amount_paid, amount_imputed, credited_invoice_id, due_at, issued_at, created_at, contacts(company, first_name, last_name)",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  const rows = data as unknown as (Pick<
    InvoiceRow,
    | "id"
    | "number"
    | "kind"
    | "title"
    | "status"
    | "total_ttc"
    | "amount_paid"
    | "amount_imputed"
    | "credited_invoice_id"
    | "due_at"
    | "issued_at"
    | "created_at"
  > & { contacts: { company: string | null; first_name: string | null; last_name: string | null } | null })[];

  // Part des avoirs émis imputée sur chaque facture
  const imputed = new Map<string, number>();
  for (const r of rows) {
    if (r.kind === "avoir" && r.status !== "brouillon" && r.credited_invoice_id) {
      imputed.set(r.credited_invoice_id, (imputed.get(r.credited_invoice_id) ?? 0) + Number(r.amount_imputed));
    }
  }
  return rows.map((r) => ({ ...r, creditsImputed: imputed.get(r.id) ?? 0 }));
}

export async function getInvoice(id: string): Promise<InvoiceRow | null> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("id", id)
    .order("position", { referencedTable: "invoice_lines" })
    .order("paid_on", { referencedTable: "invoice_payments" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const invoice = data as InvoiceRow;

  if (invoice.kind === "avoir" && invoice.credited_invoice_id) {
    const { data: original } = await supabase.from("invoices").select(RELATED_FIELDS).eq("id", invoice.credited_invoice_id).maybeSingle();
    invoice.original = (original as RelatedInvoice | null) ?? null;
  } else {
    const { data: notes } = await supabase.from("invoices").select(RELATED_FIELDS).eq("credited_invoice_id", invoice.id).order("created_at");
    invoice.credit_notes = (notes ?? []) as RelatedInvoice[];
  }
  return invoice;
}

export async function listQuoteInvoices(quoteId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, kind, status, total_ht, total_ttc, amount_paid, amount_imputed, due_at")
    .eq("quote_id", quoteId)
    .order("created_at");
  if (error) throw error;
  return data as Pick<InvoiceRow, "id" | "number" | "kind" | "status" | "total_ht" | "total_ttc" | "amount_paid" | "amount_imputed" | "due_at">[];
}
