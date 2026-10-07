import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { company } from "@/content/company";
import { parisDate } from "@/lib/booking/time";
import { euro } from "@/lib/quotes/pricing";
import { getQuoteByToken } from "@/lib/quotes/public";
import { SignaturePad } from "./SignaturePad";

export const metadata: Metadata = {
  title: "Signature de votre devis",
  robots: { index: false, follow: false },
};

// Rendu du PDF signé à la validation
export const maxDuration = 60;

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

export default function SignaturePage({ params }: PageProps<"/signature/[token]">) {
  return (
    <div className="flex-1 bg-mist text-ink">
      <header className="bg-ink px-4 py-4 text-paper">
        <div className="mx-auto max-w-3xl">
          <Logo size="sm" align="start" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <SignatureContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function SignatureContent({ params }: { params: PageProps<"/signature/[token]">["params"] }) {
  const { token } = await params;
  const quote = await getQuoteByToken(token);
  if (!quote) notFound();

  const c = quote.contacts;
  const clientName = [c?.first_name, c?.last_name].filter(Boolean).join(" ");
  const expired = quote.status === "envoye" && quote.valid_until != null && quote.valid_until < parisDate();
  const vat = Math.round(quote.total_ht * quote.vat_rate) / 100;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Devis {quote.number}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">{quote.title}</h1>
        <p className="mt-1 text-sm text-ink/60">
          Pour {c?.company ?? clientName}
          {quote.valid_until ? ` · valable jusqu'au ${dateFr.format(new Date(quote.valid_until))}` : ""}
        </p>
      </div>

      <section className="rounded-sm bg-paper p-5 shadow-sm">
        <ul className="divide-y divide-ink/10 text-sm">
          {quote.quote_lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-4 py-2">
              <span>{l.description}</span>
              <span className="shrink-0 text-ink/60">{euro.format(l.total_ht)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
          <p className="flex justify-between">
            <span>Total HT</span> <span>{euro.format(quote.total_ht)}</span>
          </p>
          <p className="flex justify-between">
            <span>TVA {quote.vat_rate} %</span> <span>{euro.format(vat)}</span>
          </p>
          <p className="flex justify-between font-display text-lg font-semibold">
            <span>Total TTC</span> <span>{euro.format(quote.total_ttc)}</span>
          </p>
        </div>
        <a href={`/signature/${token}/pdf`} target="_blank" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-strong underline">
          <FileText className="size-4" /> Lire le devis complet (PDF)
        </a>
      </section>

      <section className="rounded-sm bg-paper p-5 shadow-sm">
        {quote.status === "signe" ? (
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="size-6 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Ce devis a été signé{quote.signer_name ? ` par ${quote.signer_name}` : ""}.</p>
              <a href={`/signature/${token}/pdf`} className="mt-2 inline-block underline">
                Télécharger le devis signé
              </a>
            </div>
          </div>
        ) : expired ? (
          <p className="text-sm text-amber-800">
            La validité de ce devis est dépassée. Contactez-nous au {company.phone} pour une mise à jour.
          </p>
        ) : (
          <SignaturePad token={token} defaultName={clientName} />
        )}
      </section>

      <p className="text-center text-xs text-ink/50">
        {company.name} · {company.city} · {company.phone} · {company.email}
      </p>
    </div>
  );
}
