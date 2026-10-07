import type { InvoiceStatus } from "@/lib/invoices/data";

export function InvoiceBadge({ status, overdue, partial }: { status: InvoiceStatus; overdue?: boolean; partial?: boolean }) {
  const [label, style] = overdue
    ? ["En retard", "bg-red-100 text-red-700"]
    : status === "payee"
      ? ["Payée", "bg-emerald-100 text-emerald-800"]
      : status === "brouillon"
        ? ["Brouillon", "bg-ink/10 text-ink/60"]
        : status === "annulee"
          ? ["Annulée", "bg-ink/10 text-ink/50"]
          : partial
            ? ["Partiellement payée", "bg-amber-100 text-amber-800"]
            : ["À encaisser", "bg-sky-100 text-sky-800"];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>{label}</span>;
}
