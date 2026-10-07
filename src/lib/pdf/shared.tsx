import "server-only";
import { Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { company } from "@/content/company";

// Éléments communs aux PDF (devis, factures) : couleurs, formats, styles, logo, en-tête société.

export const INK = "#0d0e0f";
export const ACCENT = "#00b4ef";
export const STONE = "#6b6e72";

// Les polices PDF standard n'ont pas les espaces fines insécables d'Intl : on les remplace.
export const clean = (text: string) => text.replace(/[  ]/g, " ");
export const money = (n: number) => clean(new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n));
export const qty = (n: number) => clean(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n));
export const dateFr = (d: string | Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(d));
export const dateTimeFr = (d: string | Date) =>
  clean(new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "medium", timeZone: "Europe/Paris" }).format(new Date(d)));

export const s = StyleSheet.create({
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
  totals: { marginTop: 10, marginLeft: "auto", width: 230 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 6, backgroundColor: INK, color: "#ffffff", fontFamily: "Helvetica-Bold", marginTop: 3 },
  section: { marginTop: 12 },
  small: { fontSize: 7.5, color: STONE },
  signBox: { marginTop: 12, flexDirection: "row", gap: 16 },
  signArea: { flex: 1, borderWidth: 0.75, borderColor: "#c9c7c2", padding: 10, minHeight: 88 },
  certRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#d9d9d6" },
  certLabel: { width: 150, color: STONE },
});

export function Logo() {
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

/** En-tête : logo à gauche, identité légale de l'entreprise à droite. */
export function CompanyHeader() {
  return (
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
        <Text>
          SIRET {company.siret} · {company.rcs}
        </Text>
        <Text>TVA {company.vatNumber}</Text>
      </View>
    </View>
  );
}
