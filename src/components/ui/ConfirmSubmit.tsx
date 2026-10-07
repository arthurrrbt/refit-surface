"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

const tones = {
  danger: "border border-red-200 bg-paper text-red-700 hover:border-red-400",
  primary: "bg-ink text-paper hover:bg-ink-3",
};

/** Bouton d'envoi qui demande confirmation (actions importantes ou irréversibles). */
export function ConfirmSubmit({ message, children, tone = "danger" }: { message: string; children: ReactNode; tone?: keyof typeof tones }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={`inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold disabled:opacity-60 ${tones[tone]}`}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
