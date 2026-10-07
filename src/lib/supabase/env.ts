import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

export function getSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;
  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Configuration Supabase manquante : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans .env.local",
    );
  }
  return env;
}
