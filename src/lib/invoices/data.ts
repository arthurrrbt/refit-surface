import "server-only";
import { requireUser } from "@/lib/auth";
import { parisDate } from "@/lib/booking/time";
import { createClient } from "@/lib/supabase/server";

export type InvoiceStatus = "brouillon" | "emise" | "transmise" | "payee" | "annulee";
export type InvoiceKind = "acompte" | "solde" | "globale";

export const invoiceKindLabels: Record<InvoiceKind, string> = {
  acompte: "Facture d'acompte",
  solde: "Facture de solde",
  globale: "Facture",
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

export type InvoiceRow = {
  id: string;
  number: string | null;
  kind: InvoiceKind;
  title: string | null;
  quote_id: string | null;
  contact_id: string;
  status: InvoiceStatus;
  issued_at: string | null;
  due_at: string | null;
  service_date: string | null;
  total_ht: number;
  vat_rate: number;
  total_ttc: number;
  amount_paid: number;
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
};

export const INVOICE_SELECT =
  "*, contacts(kind, company, first_name, last_name, email, phone, address, postal_code, city, siret), quotes(number, title), invoice_lines(*), invoice_payments(*)";

/** Reste à payer et retard éventuel. */
export function invoiceBalance(inv: Pick<InvoiceRow, "status" | "total_ttc" | "amount_paid" | "due_at">) {
  const remaining = Math.round((inv.total_ttc - inv.amount_paid) * 100) / 100;
  const open = inv.status === "emise" || inv.status === "transmise";
  const overdue = open && remaining > 0 && inv.due_at != null && inv.due_at < parisDate();
  return { remaining, overdue };
}

export async function listInvoices() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, kind, title, status, total_ttc, amount_paid, due_at, issued_at, created_at, contacts(company, first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data as unknown as (Pick<
    InvoiceRow,
    "id" | "number" | "kind" | "title" | "status" | "total_ttc" | "amount_paid" | "due_at" | "issued_at" | "created_at"
  > & { contacts: { company: string | null; first_name: string | null; last_name: string | null } | null })[];
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
  return data as InvoiceRow | null;
}

export async function listQuoteInvoices(quoteId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, kind, status, total_ht, total_ttc, amount_paid, due_at")
    .eq("quote_id", quoteId)
    .order("created_at");
  if (error) throw error;
  return data as Pick<InvoiceRow, "id" | "number" | "kind" | "status" | "total_ht" | "total_ttc" | "amount_paid" | "due_at">[];
}
