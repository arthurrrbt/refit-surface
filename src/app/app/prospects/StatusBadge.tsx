import { leadStatusLabels, type LeadStatus } from "@/lib/leads";

const styles: Record<LeadStatus, string> = {
  nouveau: "bg-accent/15 text-accent-strong",
  qualifie: "bg-amber-100 text-amber-800",
  rdv: "bg-violet-100 text-violet-800",
  devis_envoye: "bg-sky-100 text-sky-800",
  gagne: "bg-emerald-100 text-emerald-800",
  perdu: "bg-ink/10 text-ink/50",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {leadStatusLabels[status]}
    </span>
  );
}

const universLabels: Record<string, string> = { home: "Home", glass: "Glass", pro: "Pro", boat: "Boat" };

export function UniversBadge({ univers }: { univers: string | null }) {
  if (!univers) return null;
  return (
    <span className="inline-flex rounded-sm bg-ink px-2 py-0.5 font-display text-[0.65rem] font-bold uppercase tracking-[0.15em] text-paper">
      {universLabels[univers] ?? univers}
    </span>
  );
}
