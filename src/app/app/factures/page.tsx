import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Receipt } from "lucide-react";
import { contactName } from "@/lib/leads";
import { invoiceBalance, invoiceKindLabels, listInvoices } from "@/lib/invoices/data";
import { euro } from "@/lib/quotes/pricing";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { InvoiceBadge } from "./InvoiceBadge";

export const metadata: Metadata = { title: "Factures" };

const dateFr = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

export default function InvoicesPage() {
  return (
    <>
      <PageHeader title="Factures">Créez les factures depuis un devis signé (acompte, puis solde).</PageHeader>
      <Suspense fallback={<Loading />}>
        <InvoiceList />
      </Suspense>
    </>
  );
}

async function InvoiceList() {
  const invoices = await listInvoices();
  const rows = invoices.map((inv) => ({ ...inv, ...invoiceBalance(inv, inv.creditsImputed) }));
  const open = rows.filter((r) => r.kind !== "avoir" && r.status !== "brouillon" && r.status !== "annulee" && r.remaining > 0);
  const toCollect = open.reduce((s, r) => s + r.remaining, 0);
  const overdue = open.filter((r) => r.overdue);
  const overdueAmount = overdue.reduce((s, r) => s + r.remaining, 0);

  return (
    <div className="space-y-4 p-4 sm:p-8">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-sm bg-paper p-4 shadow-sm">
          <p className="text-xs text-ink/50">À encaisser</p>
          <p className="mt-1 font-display text-2xl font-semibold">{euro.format(toCollect)}</p>
          <p className="text-xs text-ink/50">{open.length} facture(s)</p>
        </div>
        <div className={`rounded-sm p-4 shadow-sm ${overdue.length ? "bg-red-50" : "bg-paper"}`}>
          <p className="text-xs text-ink/50">En retard</p>
          <p className={`mt-1 font-display text-2xl font-semibold ${overdue.length ? "text-red-700" : ""}`}>{euro.format(overdueAmount)}</p>
          <p className="text-xs text-ink/50">{overdue.length} facture(s)</p>
        </div>
      </div>

      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/app/factures/${r.id}`} className="flex items-center gap-4 rounded-sm bg-paper p-4 shadow-sm hover:shadow-md">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{r.number ?? "Brouillon"}</span>
                    <InvoiceBadge kind={r.kind} status={r.status} overdue={r.overdue} partial={r.amount_paid > 0 && r.remaining > 0} />
                    <span className="text-xs text-ink/50">{invoiceKindLabels[r.kind]}</span>
                  </div>
                  <p className="mt-1 truncate text-sm">{contactName(r.contacts)}</p>
                  <p className="text-xs text-ink/50">
                    {r.issued_at ? `Émise le ${dateFr.format(new Date(r.issued_at))}` : `Créée le ${dateFr.format(new Date(r.created_at))}`}
                    {r.remaining > 0 && r.status !== "brouillon" && r.status !== "annulee" ? ` · ${r.kind === "avoir" ? "à rembourser" : "reste"} ${euro.format(r.remaining)}` : ""}
                  </p>
                </div>
                <span className={`font-display font-semibold ${r.kind === "avoir" ? "text-violet-700" : ""}`}>{euro.format(r.total_ttc)}</span>
                <ChevronRight className="size-5 text-ink/30" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-sm bg-paper p-10 text-center text-ink/60 shadow-sm">
          <Receipt className="size-8 text-ink/30" />
          <p className="mt-3">Aucune facture pour l&apos;instant.</p>
          <p className="mt-1 text-sm">
            Ouvrez un <Link href="/app/devis" className="underline">devis signé</Link> pour facturer l&apos;acompte ou le solde.
          </p>
        </div>
      )}
    </div>
  );
}
