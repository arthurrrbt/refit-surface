import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { requireSupabaseEnv } from "./env";

export async function createClient() {
  // Le client Supabase lit l'heure (expiration des jetons) : on attend la vraie requête,
  // sinon le prérendu avec cookies (Partial Prefetching) refuse Date.now().
  await connection();
  const cookieStore = await cookies();
  const { url, key } = requireSupabaseEnv();

  return createServerClient(url, key, {
    // Cookie de session illisible par JavaScript (HttpOnly) et réservé au HTTPS en production
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : sans effet, le proxy rafraîchit la session.
        }
      },
    },
  });
}
