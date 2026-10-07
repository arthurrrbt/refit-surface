"use client";

import { useActionState, useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Bot, Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { lancerTournee, requalifier, type AgentActionState } from "./actions";

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

function Feedback({ state }: { state: AgentActionState }) {
  if (state.error) return <p className="text-sm text-red-600">{state.error}</p>;
  if (state.message) return <p className="text-sm text-emerald-700">{state.message}</p>;
  return null;
}

/** Lance la tournée de l'Agent REFIT à la demande. */
export function RoundButton() {
  const [state, action] = useActionState<AgentActionState>(lancerTournee, {});
  return (
    <form action={action} className="space-y-2">
      <PendingButton variant="primary" pendingLabel="Tournée en cours… (1 à 3 min)">
        <Bot className="size-4" /> Lancer la tournée maintenant
      </PendingButton>
      <Feedback state={state} />
    </form>
  );
}

/** Lance ou relance l'analyse IA d'un prospect. */
export function RequalifyButton({ leadId, label }: { leadId: string; label: string }) {
  const [state, action] = useActionState<AgentActionState, FormData>(requalifier, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="lead_id" value={leadId} />
      <PendingButton pendingLabel="Analyse en cours…">
        <RefreshCw className="size-4" /> {label}
      </PendingButton>
      <Feedback state={state} />
    </form>
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
