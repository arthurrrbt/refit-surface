import "server-only";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PricingSettings, Product } from "./pricing";

export const QUOTE_STATUSES = ["brouillon", "envoye", "signe", "refuse", "expire"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  signe: "Signé",
  refuse: "Refusé",
  expire: "Expiré",
};

export type QuoteContact = {
  id: string;
  kind: string;
  company: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
};

export type QuoteLineRow = {
  id: string;
  position: number;
  kind: "matiere" | "main_oeuvre" | "deplacement" | "libre";
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price_ht: number;
  total_ht: number;
  cost_ht: number;
  details: Record<string, unknown>;
};

export type QuoteRow = {
  id: string;
  number: string | null;
  title: string | null;
  lead_id: string | null;
  contact_id: string;
  univers: string | null;
  status: QuoteStatus;
  issued_at: string | null;
  valid_until: string | null;
  labour_days: number | null;
  total_ht: number;
  vat_rate: number;
  total_ttc: number;
  total_cost_ht: number;
  deposit_rate: number | null;
  notes: string | null;
  sign_token: string | null;
  sent_at: string | null;
  pdf_sha256: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signature_meta: Record<string, unknown> | null;
  pdf_path: string | null;
  signed_pdf_path: string | null;
  created_at: string;
  contacts: QuoteContact | null;
  quote_lines: QuoteLineRow[];
};

export async function getSettings(): Promise<PricingSettings> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").single();
  if (error) throw error;
  return data as PricingSettings;
}

export async function listProducts(includeInactive = false): Promise<Product[]> {
  await requireUser();
  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("brand").order("reference");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function listQuotes() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, number, title, status, total_ttc, created_at, valid_until, signed_at, contacts(company, first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as unknown as (Pick<QuoteRow, "id" | "number" | "title" | "status" | "total_ttc" | "created_at" | "valid_until" | "signed_at"> & {
    contacts: Pick<QuoteContact, "company" | "first_name" | "last_name"> | null;
  })[];
}

export async function listLeadQuotes(leadId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, number, title, status, total_ttc, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Pick<QuoteRow, "id" | "number" | "title" | "status" | "total_ttc" | "created_at">[];
}

export async function getQuote(id: string): Promise<QuoteRow | null> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, contacts(*), quote_lines(*)")
    .eq("id", id)
    .order("position", { referencedTable: "quote_lines" })
    .maybeSingle();
  if (error) throw error;
  return data as QuoteRow | null;
}
