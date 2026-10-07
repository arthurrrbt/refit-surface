"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { signIn, type SignInState } from "./actions";

const field =
  "mt-2 block w-full rounded-sm border border-line bg-ink px-4 py-3 text-paper placeholder:text-paper/30 focus:border-accent focus:outline-none";

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="eyebrow">E-mail</span>
        <input name="email" type="email" autoComplete="email" required className={field} />
      </label>
      <label className="block">
        <span className="eyebrow">Mot de passe</span>
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
