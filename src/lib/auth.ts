import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

/**
 * Lit la session (JWT validé par getClaims) et demande à la base si le compte est gérant
 * (fonction public.is_admin(), table app_admins) — même règle que les politiques RLS.
 */
export async function getSessionUser(): Promise<{ user: AdminUser | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return { user: null, isAdmin: false };

  const user = { id: claims.sub, email: String(claims.email ?? "") };
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  return { user, isAdmin: !error && isAdmin === true };
}

/** À appeler dans chaque page, Server Action et Route Handler du back-office. */
export async function requireUser(): Promise<AdminUser> {
  const { user, isAdmin } = await getSessionUser();
  if (!user || !isAdmin) redirect("/connexion");
  return user;
}
