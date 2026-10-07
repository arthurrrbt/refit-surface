import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuoteRow } from "./data";

const TOKEN = /^[0-9a-f]{48}$/;

/** Devis accessible par son lien de signature (sans session : le jeton fait office d'autorisation). */
export async function getQuoteByToken(token: string): Promise<QuoteRow | null> {
  if (!TOKEN.test(token)) return null;
  const { data } = await createAdminClient()
    .from("quotes")
    .select("*, contacts(*), quote_lines(*)")
    .eq("sign_token", token)
    .in("status", ["envoye", "signe"])
    .order("position", { referencedTable: "quote_lines" })
    .maybeSingle();
  return (data as QuoteRow | null) ?? null;
}
