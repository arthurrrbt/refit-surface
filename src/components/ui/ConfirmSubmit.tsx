"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/** Bouton d'envoi qui demande confirmation (actions irréversibles). */
export function ConfirmSubmit({ message, children }: { message: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="inline-flex items-center gap-2 rounded-sm border border-red-200 bg-paper px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
