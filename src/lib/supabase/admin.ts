import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client « clé secrète » : contourne la RLS. Réservé aux actions publiques maîtrisées
 * (formulaire de devis…) après validation stricte des entrées. Jamais côté navigateur.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_SECRET_KEY manquante dans l'environnement");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
