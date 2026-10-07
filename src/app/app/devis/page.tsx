import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, FileText, Package, Settings } from "lucide-react";
import { contactName } from "@/lib/leads";
import { listQuotes } from "@/lib/quotes/data";
import { euro } from "@/lib/quotes/pricing";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { QuoteStatusBadge } from "./QuoteStatusBadge";

export const metadata: Metadata = { title: "Devis" };

const dateFr = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

export default function QuotesPage() {
  return (
    <>
      <PageHeader title="Devis">Créez un devis depuis la fiche d&apos;un prospect.</PageHeader>
      <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-8">
        <Link href="/app/catalogue" className="inline-flex items-center gap-2 rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm font-semibold">
          <Package className="size-4" /> Catalogue
        </Link>
        <Link href="/app/parametres" className="inline-flex items-center gap-2 rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm font-semibold">
          <Settings className="size-4" /> Paramètres de chiffrage
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <QuoteList />
      </Suspense>
    </>
  );
}

async function QuoteList() {
  const quotes = await listQuotes();
  if (!quotes.length) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex flex-col items-center rounded-sm bg-paper p-10 text-center text-ink/60 shadow-sm">
          <FileText className="size-8 text-ink/30" />
          <p className="mt-3">Aucun devis pour l&apos;instant.</p>
          <p className="mt-1 text-sm">
            Ouvrez un <Link href="/app/prospects" className="underline">prospect</Link> puis « Créer un devis ».
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="space-y-2 p-4 sm:p-8">
      {quotes.map((q) => (
        <li key={q.id}>
          <Link href={`/app/devis/${q.id}`} className="flex items-center gap-4 rounded-sm bg-paper p-4 shadow-sm hover:shadow-md">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{q.number ?? "Brouillon"}</span>
                <QuoteStatusBadge status={q.status} />
              </div>
              <p className="mt-1 truncate text-sm">{contactName(q.contacts)}</p>
              <p className="truncate text-xs text-ink/60">
                {q.title} · {dateFr.format(new Date(q.created_at))}
              </p>
            </div>
            <span className="font-display font-semibold">{euro.format(q.total_ttc)}</span>
            <ChevronRight className="size-5 text-ink/30" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
