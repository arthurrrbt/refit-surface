// Calcul des totaux de facture (partagé entre l'éditeur et le serveur).

export type InvoiceLineInput = {
  kind: "libre" | "acompte" | "deduction";
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function lineTotal(l: Pick<InvoiceLineInput, "quantity" | "unit_price">) {
  return round2(l.quantity * l.unit_price);
}

export function invoiceTotals(lines: InvoiceLineInput[], vatRate: number) {
  const total_ht = round2(lines.reduce((sum, l) => sum + lineTotal(l), 0));
  const vat = round2((total_ht * vatRate) / 100);
  return { total_ht, vat, total_ttc: round2(total_ht + vat) };
}
