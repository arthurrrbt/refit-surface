import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Download, ExternalLink, FileText, HardHat, Mail, PenLine, ShieldCheck } from "lucide-react";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { contactName } from "@/lib/leads";
import { invoiceBalance, invoiceKindLabels, listQuoteInvoices } from "@/lib/invoices/data";
import { getQuote, getSettings, listProducts } from "@/lib/quotes/data";
import { euro } from "@/lib/quotes/pricing";
import { CopyButton, PendingButton } from "../../agents/ui";
import { mailtoHref } from "../../agents/components";
import Loading from "../../loading";
import { PageHeader } from "../../ModulePlaceholder";
import { markQuoteRefused, reopenQuote, sendQuote } from "../actions";
import { QuoteEditor } from "../QuoteEditor";
import { createJob } from "../../chantiers/actions";
import { CreateInvoiceButtons } from "../../factures/InvoiceForms";
import { InvoiceBadge } from "../../factures/InvoiceBadge";
import { QuoteStatusBadge } from "../QuoteStatusBadge";

export const metadata: Metadata = { title: "Devis" };

// Génération du PDF à l'émission
export const maxDuration = 60;

const dateTimeFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

export default function QuotePage({ params }: PageProps<"/app/devis/[id]">) {
  return (
    <>
      <PageHeader title="Devis" />
      <Suspense fallback={<Loading />}>
        <QuoteView params={params} />
      </Suspense>
    </>
  );
}

async function QuoteView({ params }: { params: PageProps<"/app/devis/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const quote = await getQuote(id);
  if (!quote) notFound();

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const signUrl = quote.sign_token ? `${origin}/signature/${quote.sign_token}` : null;
  const c = quote.contacts;

  return (
    <div className="max-w-4xl space-y-4 p-4 sm:p-8">
      <Link href={quote.lead_id ? `/app/prospects/${quote.lead_id}` : "/app/devis"} className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="size-4" /> {quote.lead_id ? "Fiche prospect" : "Devis"}
      </Link>

      <div className="flex flex-wrap items-center gap-3 rounded-sm bg-paper p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold">{quote.number ?? "Devis brouillon"}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="mt-1 text-sm text-ink/60">{contactName(c)}</p>
        </div>
        <p className="font-display text-2xl font-semibold">{euro.format(quote.total_ttc)} <span className="text-sm font-normal text-ink/60">TTC</span></p>
        <a href={`/app/devis/${quote.id}/pdf`} target="_blank" className="inline-flex items-center gap-2 rounded-sm border border-ink/15 px-3 py-2 text-sm font-semibold">
          <FileText className="size-4" /> {quote.status === "brouillon" ? "Aperçu PDF" : "PDF"}
        </a>
      </div>

      {quote.status === "brouillon" && <DraftEditor quote={quote} />}

      {quote.status === "envoye" && signUrl && (
        <section className="space-y-3 rounded-sm bg-paper p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <PenLine className="size-5 text-accent-strong" /> En attente de signature
          </h2>
          <p className="text-sm text-ink/60">
            Envoyé le {quote.sent_at ? dateTimeFr.format(new Date(quote.sent_at)) : "—"}. Transmettez ce lien personnel au client : il y lit
            le devis et le signe en ligne.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="max-w-full truncate rounded-sm bg-mist px-2 py-1.5 text-xs">{signUrl}</code>
            <CopyButton text={signUrl} />
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={mailtoHref(
                c?.email,
                `Votre devis REFIT Surface ${quote.number}`,
                `Bonjour,\n\nVeuillez trouver votre devis ${quote.number} (${euro.format(quote.total_ttc)} TTC) à consulter et signer en ligne :\n${signUrl}\n\nJe reste à votre disposition pour toute question.\n\nArnaud Biet — REFIT Surface`,
              )}
              className="inline-flex items-center gap-2 rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-paper"
            >
              <Mail className="size-4" /> Envoyer par Outlook
            </a>
            <a href={signUrl} target="_blank" className="inline-flex items-center gap-2 rounded-sm border border-ink/15 px-3 py-2 text-sm font-semibold">
              <ExternalLink className="size-4" /> Faire signer sur place
            </a>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-3">
            <form action={reopenQuote}>
              <input type="hidden" name="id" value={quote.id} />
              <ConfirmSubmit message="Repasser en brouillon ? Le lien de signature actuel ne fonctionnera plus.">Modifier le devis</ConfirmSubmit>
            </form>
            <form action={markQuoteRefused}>
              <input type="hidden" name="id" value={quote.id} />
              <ConfirmSubmit message="Marquer ce devis comme refusé par le client ?">Marquer refusé</ConfirmSubmit>
            </form>
          </div>
        </section>
      )}

      {quote.status === "signe" && (
        <section className="space-y-2 rounded-sm bg-paper p-5 text-sm shadow-sm">
          <h2 className="flex items-center gap-2 font-display font-semibold text-emerald-700">
            <ShieldCheck className="size-5" /> Devis signé
          </h2>
          <p>
            Signé par <strong>{quote.signer_name}</strong> le {quote.signed_at ? dateTimeFr.format(new Date(quote.signed_at)) : "—"}.
          </p>
          <p className="text-ink/60">Le PDF signé contient le certificat de signature (horodatage, IP, empreinte du document).</p>
          <a href={`/app/devis/${quote.id}/pdf`} target="_blank" className="inline-flex items-center gap-2 rounded-sm bg-ink px-3 py-2 font-semibold text-paper">
            <Download className="size-4" /> Télécharger le devis signé
          </a>
        </section>
      )}

      {quote.status === "signe" && (
        <section className="flex flex-wrap items-center gap-3 rounded-sm bg-paper p-5 text-sm shadow-sm">
          <HardHat className="size-5 text-accent-strong" />
          <span className="flex-1 font-display font-semibold">Chantier</span>
          {quote.job_id ? (
            <Link href={`/app/chantiers/${quote.job_id}`} className="rounded-sm bg-ink px-3 py-2 font-semibold text-paper">
              Ouvrir le chantier
            </Link>
          ) : (
            <form action={createJob}>
              <input type="hidden" name="quote_id" value={quote.id} />
              <PendingButton variant="primary" pendingLabel="Création…">
                Créer le chantier
              </PendingButton>
            </form>
          )}
        </section>
      )}

      {quote.status === "signe" && <QuoteBilling quoteId={quote.id} depositRate={quote.deposit_rate ?? 0.3} />}

      {(quote.status === "refuse" || quote.status === "expire") && (
        <form action={reopenQuote} className="rounded-sm bg-paper p-4 shadow-sm">
          <input type="hidden" name="id" value={quote.id} />
          <PendingButton>Rouvrir en brouillon pour proposer une nouvelle version</PendingButton>
        </form>
      )}

      {quote.status !== "brouillon" && <ReadOnlyLines quote={quote} />}
    </div>
  );
}

/** Facturation d'un devis signé : acompte, puis solde (ou facture globale). */
async function QuoteBilling({ quoteId, depositRate }: { quoteId: string; depositRate: number }) {
  const all = await listQuoteInvoices(quoteId);
  // Les avoirs n'empêchent pas de facturer : seules les factures non annulées comptent
  const invoices = all.filter((i) => i.status !== "annulee" && i.kind !== "avoir");
  const hasDeposit = invoices.some((i) => i.kind === "acompte");
  const hasFinal = invoices.some((i) => i.kind !== "acompte");
  const options: ("acompte" | "solde" | "globale")[] = hasFinal ? [] : hasDeposit ? ["solde"] : ["acompte", "globale"];
  return (
    <section className="space-y-3 rounded-sm bg-paper p-5 text-sm shadow-sm">
      <h2 className="font-display font-semibold">Facturation</h2>
      {all.length > 0 && (
        <ul className="space-y-2">
          {all.map((inv) => {
            const b = invoiceBalance(inv);
            return (
              <li key={inv.id}>
                <Link href={`/app/factures/${inv.id}`} className="flex flex-wrap items-center gap-2 rounded-sm border border-ink/10 p-3 hover:border-ink/30">
                  <span className="font-semibold">{inv.number ?? "Brouillon"}</span>
                  <span className="text-ink/60">{invoiceKindLabels[inv.kind]}</span>
                  <InvoiceBadge kind={inv.kind} status={inv.status} overdue={b.overdue} partial={inv.amount_paid > 0 && b.remaining > 0} />
                  <span className="ml-auto font-semibold">{euro.format(inv.total_ttc)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {options.length > 0 ? (
        <CreateInvoiceButtons quoteId={quoteId} depositPercent={Math.round(depositRate * 100)} options={options} />
      ) : (
        <p className="text-ink/60">Ce devis est entièrement facturé.</p>
      )}
    </section>
  );
}

async function DraftEditor({ quote }: { quote: NonNullable<Awaited<ReturnType<typeof getQuote>>> }) {
  const [products, settings] = await Promise.all([listProducts(true), getSettings()]);
  return (
    <>
      {!products.length && (
        <p className="rounded-sm bg-amber-50 p-3 text-sm text-amber-800">
          Votre catalogue est vide : <Link href="/app/catalogue" className="underline">ajoutez vos références</Link> pour chiffrer la matière.
        </p>
      )}
      <QuoteEditor
        quoteId={quote.id}
        initialTitle={quote.title ?? ""}
        initialNotes={quote.notes ?? ""}
        initialLines={quote.quote_lines}
        products={products}
        settings={settings}
        vatRate={quote.vat_rate}
        depositRate={quote.deposit_rate ?? settings.deposit_rate}
      />
      <form action={sendQuote} className="rounded-sm border border-accent/30 bg-paper p-4 shadow-sm">
        <input type="hidden" name="id" value={quote.id} />
        <p className="mb-3 text-sm text-ink/70">
          Enregistrez d&apos;abord vos modifications. L&apos;émission attribue le numéro définitif, fige le PDF et crée le lien de signature.
        </p>
        <ConfirmSubmit tone="primary" message="Émettre ce devis ? Il sera numéroté et ne pourra plus être modifié sans repasser en brouillon.">
          Émettre et préparer la signature
        </ConfirmSubmit>
      </form>
    </>
  );
}

function ReadOnlyLines({ quote }: { quote: NonNullable<Awaited<ReturnType<typeof getQuote>>> }) {
  return (
    <section className="rounded-sm bg-paper p-5 text-sm shadow-sm">
      <h2 className="font-display font-semibold">{quote.title}</h2>
      <ul className="mt-3 divide-y divide-ink/10">
        {quote.quote_lines.map((l) => (
          <li key={l.id} className="flex justify-between gap-4 py-2">
            <span>{l.description}</span>
            <span className="shrink-0 text-ink/60">
              {l.quantity} {l.unit} × {euro.format(l.unit_price_ht)} = <strong className="text-ink">{euro.format(l.total_ht)}</strong>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-right">
        Total HT {euro.format(quote.total_ht)} · TTC <strong>{euro.format(quote.total_ttc)}</strong>
      </p>
    </section>
  );
}
