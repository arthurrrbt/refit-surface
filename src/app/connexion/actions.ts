"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isRateLimited } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string };

const credentials = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Saisissez une adresse e-mail et un mot de passe valides." };
  // Anti force brute : limite par IP du visiteur (les appels à Supabase partent tous de l'IP du serveur)
  if (await isRateLimited("connexion")) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Identifiants incorrects." };

  redirect("/app");
}
