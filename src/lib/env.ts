/**
 * Lit une variable d'environnement en retirant espaces, tabulations et retours à la ligne
 * parasites (fréquents après un copier-coller dans l'interface Vercel). Vide → undefined.
 */
export function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** URL du projet Supabase, nettoyée. Lue directement pour rester disponible côté navigateur. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || undefined;
