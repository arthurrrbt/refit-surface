import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, BellRing, FileText, Mail, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { parisDate } from "@/lib/booking/time";
import { getInvoice, invoiceBalance, invoiceKindLabels } from "@/lib/invoices/data";
import { euro } from "@/lib/quotes/pricing";
import { mailtoHref } from "../../agents/components";
import { CopyButton, PendingButton } from "../../agents/ui";
import Loading from "../../loading";
import { PageHeader } from "../../ModulePlaceholder";
import { deleteInvoiceDraft, deletePayment, markInvoiceSent } from "../actions";
import { InvoiceBadge } from "../InvoiceBadge";
import { EmitInvoiceForm, InvoiceEditor, PaymentForm } from "../InvoiceForms";

export const metadata: Metadata = { title: "Facture" };

// Génération du PDF à l'émission
export const maxDuration = 60;

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });
const methodLabels: Record<string, string> = { virement: "Virement", cheque: "Chèque", carte: "Carte", especes: "Espèces", autre: "Autre" };

export default function InvoicePage({ params }: PageProps<"/app/factures/[id]">) {
  return (
    <>
      <PageHeader title="Facture" />
      <Suspense fallback={<Loading />}>
        <InvoiceView params={params} />
      </Suspense>
    </>
  );
}

async function InvoiceView({ params }: { params: PageProps<"/app/factures/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const { remaining, overdue } = invoiceBalance(invoice);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const downloadUrl = invoice.share_token ? `${origin}/facture/${invoice.share_token}` : null;
  const c = invoice.contacts;
  const label = `${invoiceKindLabels[invoice.kind]} ${invoice.number ?? ""}`.trim();

  return (
    <div className="max-w-4xl space-y-4 p-4 sm:p-8">
      <Link href={invoice.quote_id ? `/app/devis/${invoice.quote_id}` : "/app/factures"} className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="size-4" /> {invoice.quote_id ? `Devis ${invoice.quotes?.number ?? ""}` : "Factures"}
      </Link>

      <div className="flex flex-wrap items-center gap-3 rounded-sm bg-paper p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold">{invoice.number ? label : `${invoiceKindLabels[invoice.kind]} (brouillon)`}</h1>
            <InvoiceBadge status={invoice.status} overdue={overdue} partial={invoice.amount_paid > 0 && remaining > 0} />
          </div>
          <p className="mt-1 text-sm text-ink/60">
            {invoice.client_snapshot?.name ?? [c?.company, c?.first_name, c?.last_name].filter(Boolean).join(" ")}
            {invoice.due_at && invoice.status !== "brouillon" ? ` · échéance ${dateFr.format(new Date(invoice.due_at))}` : ""}
          </p>
        </div>
        <p className="font-display text-2xl font-semibold">
          {euro.format(invoice.total_ttc)} <span className="text-sm font-normal text-ink/50">TTC</span>
        </p>
        <a href={`/app/factures/${invoice.id}/pdf`} target="_blank" className="inline-flex items-center gap-2 rounded-sm border border-ink/15 px-3 py-2 text-sm font-semibold">
          <FileText className="size-4" /> {invoice.status === "brouillon" ? "Aperçu PDF" : "PDF"}
        </a>
      </div>

      {invoice.status === "brouillon" ? (
        <>
          <InvoiceEditor
            id={invoice.id}
            initialTitle={invoice.title ?? ""}
            initialServiceDate={invoice.service_date ?? ""}
            initialNotes={invoice.notes ?? ""}
            initialLines={invoice.invoice_lines}
            vatRate={invoice.vat_rate}
            needsServiceDate={invoice.kind !== "acompte"}
          />
          <EmitInvoiceForm id={invoice.id} />
          <form action={deleteInvoiceDraft} className="flex justify-end">
            <input type="hidden" name="id" value={invoice.id} />
            <ConfirmSubmit message="Supprimer ce brouillon de facture ?">
              <Trash2 className="size-4" /> Supprimer le brouillon
            </ConfirmSubmit>
          </form>
        </>
      ) : (
        <>
          {downloadUrl && (
            <section className="space-y-3 rounded-sm bg-paper p-5 shadow-sm">
              <h2 className="font-display font-semibold">Envoyer au client</h2>
              <p className="text-sm text-ink/60">
                {invoice.sent_at ? `Marquée envoyée le ${dateFr.format(new Date(invoice.sent_at))}. ` : ""}
                Le lien ci-dessous permet au client de télécharger sa facture.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="max-w-full truncate rounded-sm bg-mist px-2 py-1.5 text-xs">{downloadUrl}</code>
                <CopyButton text={downloadUrl} />
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={mailtoHref(
                    c?.email,
                    `${label} — REFIT Surface`,
                    `Bonjour,\n\nVeuillez trouver votre ${label.toLowerCase()} d'un montant de ${euro.format(invoice.total_ttc)} TTC :\n${downloadUrl}\n\nMerci pour votre confiance.\n\nArnaud Biet — REFIT Surface`,
                  )}
                  className="inline-flex items-center gap-2 rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-paper"
                >
                  <Mail className="size-4" /> Envoyer par Outlook
                </a>
                {!invoice.sent_at && (
                  <form action={markInvoiceSent}>
                    <input type="hidden" name="id" value={invoice.id} />
                    <PendingButton>Marquer comme envoyée</PendingButton>
                  </form>
                )}
                {overdue && (
                  <a
                    href={mailtoHref(
                      c?.email,
                      `Rappel — ${label}`,
                      `Bonjour,\n\nSauf erreur de notre part, la ${label.toLowerCase()} (${euro.format(invoice.total_ttc)} TTC, échéance au ${invoice.due_at ? dateFr.format(new Date(invoice.due_at)) : "—"}) reste à régler à hauteur de ${euro.format(remaining)}.\n\nVous pouvez la retrouver ici : ${downloadUrl}\n\nSi le règlement a déjà été effectué, merci de ne pas tenir compte de ce message.\n\nArnaud Biet — REFIT Surface`,
                    )}
                    className="inline-flex items-center gap-2 rounded-sm border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                  >
                    <BellRing className="size-4" /> Relancer le client
                  </a>
                )}
              </div>
            </section>
          )}

          <section className="space-y-3 rounded-sm bg-paper p-5 shadow-sm">
            <h2 className="font-display font-semibold">Encaissements</h2>
            {invoice.invoice_payments.length ? (
              <ul className="divide-y divide-ink/10 text-sm">
                {invoice.invoice_payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2">
                    <span className="w-28 shrink-0">{dateFr.format(new Date(p.paid_on))}</span>
                    <span className="flex-1">
                      {methodLabels[p.method] ?? p.method}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </span>
                    <span className="font-semibold">{euro.format(p.amount)}</span>
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="invoice_id" value={invoice.id} />
                      <ConfirmSubmit message="Supprimer cet encaissement ?">
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Supprimer</span>
                      </ConfirmSubmit>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink/50">Aucun encaissement enregistré.</p>
            )}
            <p className="text-sm">
              Réglé {euro.format(invoice.amount_paid)} · <strong>reste {euro.format(Math.max(remaining, 0))}</strong>
            </p>
            {remaining > 0 && <PaymentForm invoiceId={invoice.id} remaining={remaining} today={parisDate()} />}
          </section>

          <section className="rounded-sm bg-paper p-5 text-sm shadow-sm">
            <h2 className="font-display font-semibold">{invoice.title}</h2>
            <ul className="mt-3 divide-y divide-ink/10">
              {invoice.invoice_lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-4 py-2">
                  <span>{l.description}</span>
                  <span className="shrink-0 font-semibold">{euro.format(l.total_ht)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right">
              Total HT {euro.format(invoice.total_ht)} · TTC <strong>{euro.format(invoice.total_ttc)}</strong>
            </p>
          </section>
        </>
      )}
    </div>
  );
}
