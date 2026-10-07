import "server-only";
import { Document, Image, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { company } from "@/content/company";
import type { QuoteLineRow, QuoteRow } from "./data";

const INK = "#0d0e0f";
const ACCENT = "#00b4ef";
const STONE = "#6b6e72";

// Les polices PDF standard n'ont pas les espaces fines insécables d'Intl : on les remplace.
const clean = (s: string) => s.replace(/[  ]/g, " ");
const money = (n: number) => clean(new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n));
const qty = (n: number) => clean(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n));
const dateFr = (d: string | Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(d));
const dateTimeFr = (d: string | Date) =>
  clean(new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "medium", timeZone: "Europe/Paris" }).format(new Date(d)));

const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 36, paddingHorizontal: 40, fontSize: 9, fontFamily: "Helvetica", color: INK, lineHeight: 1.4 },
  row: { flexDirection: "row" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  companyBlock: { textAlign: "right", color: STONE, fontSize: 8 },
  title: { marginTop: 18, fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  accentRule: { width: 40, height: 2, backgroundColor: ACCENT, marginTop: 10 },
  meta: { marginTop: 8, color: STONE },
  parties: { flexDirection: "row", marginTop: 14, gap: 16 },
  box: { flex: 1, padding: 10, backgroundColor: "#f4f4f2" },
  label: { fontSize: 7, color: STONE, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  bold: { fontFamily: "Helvetica-Bold" },
  table: { marginTop: 18 },
  th: { flexDirection: "row", backgroundColor: INK, color: "#ffffff", paddingVertical: 5, paddingHorizontal: 6, fontFamily: "Helvetica-Bold", fontSize: 8 },
  tr: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: "#d9d9d6" },
  cDesc: { flex: 5 },
  cQty: { flex: 1, textAlign: "right" },
  cUnit: { flex: 1, textAlign: "center" },
  cPu: { flex: 1.4, textAlign: "right" },
  cTot: { flex: 1.5, textAlign: "right" },
  totals: { marginTop: 10, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 6, backgroundColor: INK, color: "#ffffff", fontFamily: "Helvetica-Bold", marginTop: 3 },
  section: { marginTop: 12 },
  small: { fontSize: 7.5, color: STONE },
  signBox: { marginTop: 12, flexDirection: "row", gap: 16 },
  signArea: { flex: 1, borderWidth: 0.75, borderColor: "#c9c7c2", padding: 10, minHeight: 88 },
  certRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#d9d9d6" },
  certLabel: { width: 150, color: STONE },
});

function Logo() {
  return (
    <Svg viewBox="0 0 545 100" style={{ width: 150, height: 27.5 }}>
      <Path fill={INK} d="M0 0H110A31 31 0 0 1 110 62H92L130 100H82L21 39H110A8 8 0 0 0 110 23H23Z" />
      <Path fill={INK} d="M0 42V100H58Z" />
      <Path fill={ACCENT} d="M12 42H24L82 100H70Z" />
      <Path fill={INK} d="M157 0H249V23H182V38.5H243V61.5H182V77H249V100H157Z" />
      <Path fill={INK} d="M265 0H355V23H290V38.5H347V61.5H290V100H265Z" />
      <Path fill={INK} d="M371 0H397V100H371Z" />
      <Path fill={INK} d="M413 0H525V23H482V100H456V23H413Z" />
    </Svg>
  );
}

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
        <View style={s.header}>
          <View>
            <Logo />
            <Text style={{ fontSize: 8, letterSpacing: 4, marginTop: 4, marginLeft: 2 }}>SURFACE</Text>
          </View>
          <View style={s.companyBlock}>
            <Text style={[s.bold, { color: INK }]}>{company.name}</Text>
            <Text>{company.address}</Text>
            <Text>
              {company.postalCode} {company.city}
            </Text>
            <Text>{company.phone}</Text>
            <Text>{company.email}</Text>
            <Text style={{ marginTop: 4 }}>{company.legalForm}</Text>
            <Text>SIRET {company.siret} · {company.rcs}</Text>
            <Text>TVA {company.vatNumber}</Text>
          </View>
        </View>

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
