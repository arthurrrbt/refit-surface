import { quoteStatusLabels, type QuoteStatus } from "@/lib/quotes/data";

const styles: Record<QuoteStatus, string> = {
  brouillon: "bg-ink/10 text-ink/60",
  envoye: "bg-sky-100 text-sky-800",
  signe: "bg-emerald-100 text-emerald-800",
  refuse: "bg-red-100 text-red-700",
  expire: "bg-amber-100 text-amber-800",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>{quoteStatusLabels[status]}</span>;
}
