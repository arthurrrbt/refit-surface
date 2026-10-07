import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, SUPABASE_URL } from "@/lib/env";

/**
 * Client « clé secrète » : contourne la RLS. Réservé aux actions publiques maîtrisées
 * (formulaire de devis…) après validation stricte des entrées. Jamais côté navigateur.
 */
export function createAdminClient() {
  const key = env("SUPABASE_SECRET_KEY");
  if (!SUPABASE_URL || !key) throw new Error("SUPABASE_SECRET_KEY manquante dans l'environnement");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
