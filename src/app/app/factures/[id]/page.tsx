import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, BellRing, FileText, Mail, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { parisDate } from "@/lib/booking/time";
import { creditedHt, getInvoice, invoiceBalance, invoiceKindLabels, type InvoiceRow } from "@/lib/invoices/data";
import { euro } from "@/lib/quotes/pricing";
import { mailtoHref } from "../../agents/components";
import { CopyButton, PendingButton } from "../../agents/ui";
import Loading from "../../loading";
import { PageHeader } from "../../ModulePlaceholder";
import { deleteInvoiceDraft, deletePayment, markInvoiceSent } from "../actions";
import { InvoiceBadge } from "../InvoiceBadge";
import { CreditNoteForm, EmitInvoiceForm, InvoiceEditor, PaymentForm } from "../InvoiceForms";

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

  const isCreditNote = invoice.kind === "avoir";
  const creditsImputed = (invoice.credit_notes ?? []).filter((n) => n.status !== "brouillon").reduce((sum, n) => sum + Number(n.amount_imputed), 0);
  const { remaining, overdue } = invoiceBalance(invoice, creditsImputed);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const downloadUrl = invoice.share_token ? `${origin}/facture/${invoice.share_token}` : null;
  const c = invoice.contacts;
  const label = `${invoiceKindLabels[invoice.kind]} ${invoice.number ?? ""}`.trim();
  const back = isCreditNote && invoice.original
    ? { href: `/app/factures/${invoice.original.id}`, text: `Facture ${invoice.original.number ?? ""}` }
    : invoice.quote_id
      ? { href: `/app/devis/${invoice.quote_id}`, text: `Devis ${invoice.quotes?.number ?? ""}` }
      : { href: "/app/factures", text: "Factures" };

  return (
    <div className="max-w-4xl space-y-4 p-4 sm:p-8">
      <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="size-4" /> {back.text}
      </Link>

      <div className="flex flex-wrap items-center gap-3 rounded-sm bg-paper p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold">{invoice.number ? label : `${invoiceKindLabels[invoice.kind]} (brouillon)`}</h1>
            <InvoiceBadge kind={invoice.kind} status={invoice.status} overdue={overdue} partial={invoice.amount_paid > 0 && remaining > 0} />
          </div>
          <p className="mt-1 text-sm text-ink/60">
            {invoice.client_snapshot?.name ?? [c?.company, c?.first_name, c?.last_name].filter(Boolean).join(" ")}
            {isCreditNote && invoice.original ? ` · sur la facture ${invoice.original.number}` : ""}
            {!isCreditNote && invoice.due_at && invoice.status !== "brouillon" ? ` · échéance ${dateFr.format(new Date(invoice.due_at))}` : ""}
          </p>
        </div>
        <p className={`font-display text-2xl font-semibold ${isCreditNote ? "text-violet-700" : ""}`}>
          {euro.format(invoice.total_ttc)} <span className="text-sm font-normal text-ink/60">TTC</span>
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
            needsServiceDate={invoice.kind !== "acompte" && !isCreditNote}
          />
          <EmitInvoiceForm id={invoice.id} creditNote={isCreditNote} />
          <form action={deleteInvoiceDraft} className="flex justify-end">
            <input type="hidden" name="id" value={invoice.id} />
            <ConfirmSubmit message="Supprimer ce brouillon ?">
              <Trash2 className="size-4" /> Supprimer le brouillon
            </ConfirmSubmit>
          </form>
        </>
      ) : (
        <>
          {downloadUrl && <SendSection invoice={invoice} label={label} downloadUrl={downloadUrl} overdue={overdue} remaining={remaining} />}

          {isCreditNote ? (
            <CreditNoteSettlement invoice={invoice} remaining={remaining} />
          ) : (
            <>
              <Payments invoice={invoice} remaining={remaining} creditsImputed={creditsImputed} />
              <CreditNotes invoice={invoice} />
            </>
          )}

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

function SendSection({ invoice, label, downloadUrl, overdue, remaining }: { invoice: InvoiceRow; label: string; downloadUrl: string; overdue: boolean; remaining: number }) {
  const c = invoice.contacts;
  const isCreditNote = invoice.kind === "avoir";
  const body = isCreditNote
    ? `Bonjour,\n\nVeuillez trouver votre avoir ${invoice.number} d'un montant de ${euro.format(Math.abs(invoice.total_ttc))} TTC, établi sur la facture ${invoice.original?.number ?? ""} :\n${downloadUrl}\n\nArnaud Biet — REFIT Surface`
    : `Bonjour,\n\nVeuillez trouver votre ${label.toLowerCase()} d'un montant de ${euro.format(invoice.total_ttc)} TTC :\n${downloadUrl}\n\nMerci pour votre confiance.\n\nArnaud Biet — REFIT Surface`;
  return (
    <section className="space-y-3 rounded-sm bg-paper p-5 shadow-sm">
      <h2 className="font-display font-semibold">Envoyer au client</h2>
      <p className="text-sm text-ink/60">
        {invoice.sent_at ? `Marqué envoyé le ${dateFr.format(new Date(invoice.sent_at))}. ` : ""}
        Le lien ci-dessous permet au client de télécharger le document.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="max-w-full truncate rounded-sm bg-mist px-2 py-1.5 text-xs">{downloadUrl}</code>
        <CopyButton text={downloadUrl} />
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={mailtoHref(c?.email, `${label} — REFIT Surface`, body)} className="inline-flex items-center gap-2 rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-paper">
          <Mail className="size-4" /> Envoyer par Outlook
        </a>
        {!invoice.sent_at && (
          <form action={markInvoiceSent}>
            <input type="hidden" name="id" value={invoice.id} />
            <PendingButton>Marquer comme envoyé</PendingButton>
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
  );
}

function PaymentList({ invoice, emptyText }: { invoice: InvoiceRow; emptyText: string }) {
  if (!invoice.invoice_payments.length) return <p className="text-sm text-ink/60">{emptyText}</p>;
  return (
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
            <ConfirmSubmit message="Supprimer cette opération ?">
              <Trash2 className="size-3.5" />
              <span className="sr-only">Supprimer</span>
            </ConfirmSubmit>
          </form>
        </li>
      ))}
    </ul>
  );
}

function Payments({ invoice, remaining, creditsImputed }: { invoice: InvoiceRow; remaining: number; creditsImputed: number }) {
  return (
    <section className="space-y-3 rounded-sm bg-paper p-5 shadow-sm">
      <h2 className="font-display font-semibold">Encaissements</h2>
      <PaymentList invoice={invoice} emptyText="Aucun encaissement enregistré." />
      <p className="text-sm">
        Réglé {euro.format(invoice.amount_paid)}
        {creditsImputed > 0 ? ` · avoirs imputés ${euro.format(creditsImputed)}` : ""} · <strong>reste {euro.format(Math.max(remaining, 0))}</strong>
      </p>
      {remaining > 0 && invoice.status !== "annulee" && <PaymentForm invoiceId={invoice.id} remaining={remaining} today={parisDate()} />}
    </section>
  );
}

function CreditNotes({ invoice }: { invoice: InvoiceRow }) {
  const notes = invoice.credit_notes ?? [];
  const creditable = Math.round((invoice.total_ht - creditedHt(notes)) * 100) / 100;
  const draft = notes.find((n) => n.status === "brouillon");
  return (
    <section className="space-y-3 rounded-sm bg-paper p-5 text-sm shadow-sm">
      <h2 className="font-display font-semibold">Avoirs</h2>
      <p className="text-ink/60">Une facture émise ne se modifie pas : pour la corriger ou l&apos;annuler, établissez un avoir.</p>
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <Link href={`/app/factures/${n.id}`} className="flex flex-wrap items-center gap-2 rounded-sm border border-ink/10 p-3 hover:border-ink/30">
                <span className="font-semibold">{n.number ?? "Avoir (brouillon)"}</span>
                <InvoiceBadge kind="avoir" status={n.status} />
                <span className="ml-auto font-semibold text-violet-700">{euro.format(n.total_ttc)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {draft ? (
        <p className="text-ink/60">Un avoir est en préparation : ouvrez-le pour l&apos;émettre.</p>
      ) : creditable > 0 && invoice.status !== "annulee" ? (
        <details className="rounded-sm border border-ink/10 p-3">
          <summary className="cursor-pointer font-semibold text-violet-700">Établir un avoir</summary>
          <div className="mt-3">
            <CreditNoteForm invoiceId={invoice.id} creditableHt={creditable} allowTotal={creditedHt(notes) === 0} />
          </div>
        </details>
      ) : (
        <p className="text-ink/60">Cette facture est entièrement créditée.</p>
      )}
    </section>
  );
}

function CreditNoteSettlement({ invoice, remaining }: { invoice: InvoiceRow; remaining: number }) {
  return (
    <section className="space-y-3 rounded-sm bg-paper p-5 text-sm shadow-sm">
      <h2 className="font-display font-semibold">Règlement de l&apos;avoir</h2>
      <p>
        Montant de l&apos;avoir : <strong>{euro.format(Math.abs(invoice.total_ttc))} TTC</strong>
      </p>
      <p>
        Imputé sur la facture {invoice.original?.number} : {euro.format(invoice.amount_imputed)}
      </p>
      <PaymentList invoice={invoice} emptyText="Aucun remboursement enregistré." />
      <p>
        <strong>{remaining > 0 ? `Reste à rembourser au client : ${euro.format(remaining)}` : "Avoir entièrement soldé."}</strong>
      </p>
      {remaining > 0 && <PaymentForm invoiceId={invoice.id} remaining={remaining} today={parisDate()} refund />}
    </section>
  );
}
