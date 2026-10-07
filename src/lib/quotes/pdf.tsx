import "server-only";
import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { company } from "@/content/company";
import { CompanyHeader, Logo, dateFr, dateTimeFr, money, qty, s } from "@/lib/pdf/shared";
import type { QuoteLineRow, QuoteRow } from "./data";

function clientName(q: QuoteRow) {
  const c = q.contacts;
  if (!c) return "Client";
  const person = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return c.company ? `${c.company}${person ? ` — ${person}` : ""}` : person;
}

export type SignatureForPdf = {
  name: string;
  imageDataUrl: string;
  signedAt: string;
  ip: string;
  userAgent: string;
  sentPdfSha256: string;
};

function QuoteDocument({ quote, lines, signature }: { quote: QuoteRow; lines: QuoteLineRow[]; signature?: SignatureForPdf }) {
  const vat = Math.round(quote.total_ht * quote.vat_rate) / 100;
  const depositRate = quote.deposit_rate ?? 0;
  const deposit = Math.round(quote.total_ttc * depositRate * 100) / 100;
  const c = quote.contacts;
  const isConsumer = c?.kind !== "professionnel";

  return (
    <Document title={`Devis ${quote.number ?? "brouillon"} — ${company.name}`} author={company.name} language="fr">
      <Page size="A4" style={s.page}>
        <CompanyHeader />

        <Text style={s.title}>{quote.number ? `DEVIS ${quote.number}` : "DEVIS — BROUILLON"}</Text>
        <View style={s.accentRule} />
        <Text style={s.meta}>
          {quote.issued_at ? `Établi le ${dateFr(quote.issued_at)}` : "Non émis"}
          {quote.valid_until ? ` · Valable jusqu'au ${dateFr(quote.valid_until)}` : ""}
        </Text>

        <View style={s.parties}>
          <View style={s.box}>
            <Text style={s.label}>Client</Text>
            <Text style={s.bold}>{clientName(quote)}</Text>
            {c?.address && <Text>{c.address}</Text>}
            {(c?.postal_code || c?.city) && <Text>{[c?.postal_code, c?.city].filter(Boolean).join(" ")}</Text>}
            {c?.email && <Text>{c.email}</Text>}
            {c?.phone && <Text>{c.phone}</Text>}
          </View>
          <View style={s.box}>
            <Text style={s.label}>Objet</Text>
            <Text style={s.bold}>{quote.title || "Rénovation de surfaces"}</Text>
            {quote.labour_days ? <Text>Durée de pose estimée : {qty(quote.labour_days)} jour(s)</Text> : null}
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
          {lines.map((l) => (
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
            <Text>{money(quote.total_ht)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>TVA {qty(quote.vat_rate)} %</Text>
            <Text>{money(vat)}</Text>
          </View>
          <View style={s.grandTotal}>
            <Text>Total TTC</Text>
            <Text>{money(quote.total_ttc)}</Text>
          </View>
          {depositRate > 0 && (
            <View style={s.totalRow}>
              <Text>Acompte à la signature ({qty(depositRate * 100)} %)</Text>
              <Text>{money(deposit)}</Text>
            </View>
          )}
        </View>

        {quote.notes ? (
          <View style={s.section}>
            <Text style={s.label}>Remarques</Text>
            <Text>{quote.notes}</Text>
          </View>
        ) : null}

        <View style={s.section} wrap={false}>
          <Text style={s.label}>Conditions</Text>
          <Text style={s.small}>Devis gratuit. {company.paymentTerms}</Text>
          <Text style={s.small}>{company.latePenalty}</Text>
          <Text style={s.small}>Assurance professionnelle : {company.insurance}</Text>
          {isConsumer && <Text style={s.small}>Médiation de la consommation : {company.mediator}</Text>}
        </View>

        <View style={s.signBox} wrap={false}>
          <View style={s.signArea}>
            <Text style={s.label}>Pour {company.name}</Text>
            <Text>Arnaud Biet, gérant</Text>
          </View>
          <View style={s.signArea}>
            <Text style={s.label}>Bon pour accord — le client</Text>
            {signature ? (
              <>
                <Text>
                  {signature.name}, le {dateTimeFr(signature.signedAt)}
                </Text>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- composant PDF, pas d'attribut alt */}
                <Image src={signature.imageDataUrl} style={{ width: 150, height: 55, objectFit: "contain", marginTop: 4 }} />
                <Text style={s.small}>Signé électroniquement — voir le certificat joint.</Text>
              </>
            ) : (
              <Text style={s.small}>Date, nom et signature précédés de la mention « Bon pour accord ».</Text>
            )}
          </View>
        </View>

      </Page>

      {signature && (
        <Page size="A4" style={s.page}>
            <Logo />
          <Text style={s.title}>CERTIFICAT DE SIGNATURE ÉLECTRONIQUE</Text>
          <View style={s.accentRule} />
          <Text style={[s.meta, { marginBottom: 14 }]}>
            Ce certificat atteste de l&apos;acceptation électronique du devis ci-dessus (signature électronique simple au sens du
            règlement européen eIDAS n° 910/2014).
          </Text>
          {[
            ["Document", `Devis ${quote.number} — ${quote.title ?? ""}`],
            ["Montant accepté", `${money(quote.total_ttc)} TTC`],
            ["Signataire", signature.name],
            ["Date et heure (Paris)", dateTimeFr(signature.signedAt)],
            ["Adresse IP", signature.ip],
            ["Navigateur / appareil", signature.userAgent],
            ["Empreinte SHA-256 du devis envoyé", signature.sentPdfSha256],
            ["Méthode", "Lien personnel unique, lecture du devis, mention « Bon pour accord » cochée, signature manuscrite tracée à l'écran."],
          ].map(([label, value]) => (
            <View key={label} style={s.certRow}>
              <Text style={s.certLabel}>{label}</Text>
              <Text style={{ flex: 1 }}>{value}</Text>
            </View>
          ))}
          <Text style={[s.small, { marginTop: 14 }]}>
            L&apos;empreinte SHA-256 permet de vérifier que le devis signé est identique au devis envoyé au client : toute
            modification du document envoyé produirait une empreinte différente.
          </Text>
        </Page>
      )}
    </Document>
  );
}

export async function renderQuotePdf(quote: QuoteRow, signature?: SignatureForPdf): Promise<Buffer> {
  return renderToBuffer(<QuoteDocument quote={quote} lines={quote.quote_lines} signature={signature} />);
}
