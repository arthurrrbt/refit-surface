import "server-only";
import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { company } from "@/content/company";
import { CompanyHeader, dateFr, money, qty, s } from "@/lib/pdf/shared";
import { invoiceKindLabels, type InvoiceRow } from "./data";

/** PDF de facture avec les mentions obligatoires (y compris celles de la réforme de la facture électronique). */
function InvoiceDocument({ invoice }: { invoice: InvoiceRow }) {
  const client = invoice.client_snapshot;
  const isPro = client?.kind === "professionnel";
  const vat = Math.round(invoice.total_ht * invoice.vat_rate) / 100;
  const title = `${invoiceKindLabels[invoice.kind].toUpperCase()} ${invoice.number ?? "— BROUILLON"}`;

  return (
    <Document title={`${invoiceKindLabels[invoice.kind]} ${invoice.number ?? "brouillon"} — ${company.name}`} author={company.name} language="fr">
      <Page size="A4" style={s.page}>
        <CompanyHeader />

        <Text style={s.title}>{title}</Text>
        <View style={s.accentRule} />
        <Text style={s.meta}>
          {invoice.issued_at ? `Émise le ${dateFr(invoice.issued_at)}` : "Non émise"}
          {invoice.service_date ? ` · Travaux réalisés le ${dateFr(invoice.service_date)}` : ""}
          {invoice.quotes?.number ? ` · Devis ${invoice.quotes.number}` : ""}
        </Text>

        <View style={s.parties}>
          <View style={s.box}>
            <Text style={s.label}>Client</Text>
            <Text style={s.bold}>{client?.name ?? "Client"}</Text>
            {client?.address && <Text>{client.address}</Text>}
            {(client?.postal_code || client?.city) && <Text>{[client?.postal_code, client?.city].filter(Boolean).join(" ")}</Text>}
            {isPro && client?.siren && <Text>SIREN {client.siren}</Text>}
          </View>
          <View style={s.box}>
            <Text style={s.label}>Objet</Text>
            <Text style={s.bold}>{invoice.title ?? "Rénovation de surfaces"}</Text>
            <Text>Catégorie : {invoice.operation_category}</Text>
            <Text>Adresse d&apos;exécution : celle du client, sauf mention contraire</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.th} fixed>
            <Text style={s.cDesc}>Désignation</Text>
            <Text style={s.cQty}>Qté</Text>
            <Text style={s.cUnit}>Unité</Text>
            <Text style={s.cPu}>PU HT</Text>
            <Text style={s.cTot}>Total HT</Text>
          </View>
          {invoice.invoice_lines.map((l) => (
            <View key={l.id} style={s.tr} wrap={false}>
              <Text style={s.cDesc}>{l.description}</Text>
              <Text style={s.cQty}>{qty(l.quantity)}</Text>
              <Text style={s.cUnit}>{l.unit}</Text>
              <Text style={s.cPu}>{money(l.unit_price_ht)}</Text>
              <Text style={s.cTot}>{money(l.total_ht)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}>
            <Text>Total HT</Text>
            <Text>{money(invoice.total_ht)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>TVA {qty(invoice.vat_rate)} %</Text>
            <Text>{money(vat)}</Text>
          </View>
          <View style={s.grandTotal}>
            <Text>{invoice.kind === "solde" ? "Net à payer TTC" : "Total TTC"}</Text>
            <Text>{money(invoice.total_ttc)}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <View style={s.section}>
            <Text style={s.label}>Remarques</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}

        <View style={s.section} wrap={false}>
          <Text style={s.label}>Règlement</Text>
          <Text>
            {invoice.due_at && invoice.issued_at && invoice.due_at > invoice.issued_at
              ? `À régler au plus tard le ${dateFr(invoice.due_at)}.`
              : "Payable à réception."}{" "}
            Virement : {company.iban}
          </Text>
          <Text style={s.small}>Pas d&apos;escompte pour paiement anticipé. TVA acquittée sur les encaissements.</Text>
          <Text style={s.small}>{company.latePenalty}</Text>
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.label}>Mentions</Text>
          <Text style={s.small}>Assurance professionnelle : {company.insurance}</Text>
          {!isPro && <Text style={s.small}>Médiation de la consommation : {company.mediator}</Text>}
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceRow): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} />);
}
