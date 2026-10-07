import type { InvoiceKind, InvoiceStatus } from "@/lib/invoices/data";

export function InvoiceBadge({
  status,
  overdue,
  partial,
  kind,
}: {
  status: InvoiceStatus;
  overdue?: boolean;
  partial?: boolean;
  kind?: InvoiceKind;
}) {
  const [label, style] =
    status === "brouillon"
      ? ["Brouillon", "bg-ink/10 text-ink/60"]
      : kind === "avoir"
        ? status === "payee"
          ? ["Soldé", "bg-emerald-100 text-emerald-800"]
          : ["À rembourser", "bg-violet-100 text-violet-800"]
        : overdue
          ? ["En retard", "bg-red-100 text-red-700"]
          : status === "payee"
            ? ["Payée", "bg-emerald-100 text-emerald-800"]
            : status === "annulee"
              ? ["Annulée par avoir", "bg-ink/10 text-ink/50"]
              : partial
                ? ["Partiellement payée", "bg-amber-100 text-amber-800"]
                : ["À encaisser", "bg-sky-100 text-sky-800"];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>{label}</span>;
}
