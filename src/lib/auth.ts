import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

/**
 * Couche d'accès : vérifie la session (JWT validé par getClaims) et l'e-mail du gérant.
 * À appeler dans chaque page, Server Action ou Route Handler du back-office.
 */
export async function requireUser(): Promise<AdminUser> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/connexion");

  const email = String(claims.email ?? "");
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && email.toLowerCase() !== adminEmail.toLowerCase()) {
    await supabase.auth.signOut();
    redirect("/connexion");
  }

  return { id: claims.sub, email };
}
