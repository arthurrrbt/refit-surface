"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, Loader2 } from "lucide-react";

const primary =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink-3 disabled:opacity-60";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm font-semibold transition-colors hover:border-ink/40 disabled:opacity-60";

/** Bouton d'envoi qui affiche un indicateur pendant l'action serveur. */
export function PendingButton({
  children,
  pendingLabel,
  variant = "secondary",
  ...props
}: { children: ReactNode; pendingLabel?: string; variant?: "primary" | "secondary" } & ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button {...props} disabled={pending || props.disabled} className={variant === "primary" ? primary : secondary}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={secondary}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {copied ? "Copié" : "Copier"}
    </button>
  );
}
