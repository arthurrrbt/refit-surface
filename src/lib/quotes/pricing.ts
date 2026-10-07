// Moteur de chiffrage « matière + main d'œuvre », partagé entre l'éditeur (calcul en direct)
// et le serveur (calcul qui fait foi à l'enregistrement).

export type PricingSettings = {
  day_rate: number;
  material_margin: number;
  default_waste_rate: number;
  travel_fee: number;
  vat_rate: number;
  quote_validity_days: number;
  deposit_rate: number;
  invoice_due_days: number;
};

export type Product = {
  id: string;
  brand: string;
  reference: string;
  name: string;
  category: string | null;
  finish: string | null;
  purchase_price_m2: number | null;
  sale_price_m2: number | null;
  waste_rate: number;
  active: boolean;
};

export type LineInput =
  | { kind: "matiere"; product_id: string; description: string; surface_m2: number }
  | { kind: "main_oeuvre"; description: string; days: number }
  | { kind: "deplacement"; description: string; amount: number }
  | { kind: "libre"; description: string; quantity: number; unit: string; unit_price: number };

export type ComputedLine = {
  kind: LineInput["kind"];
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price_ht: number;
  total_ht: number;
  cost_ht: number;
  details: Record<string, unknown>;
};

export type QuoteTotals = {
  total_ht: number;
  vat: number;
  total_ttc: number;
  cost_ht: number; // coût matière
  margin_ht: number; // HT − coût matière
  labour_days: number;
  earned_per_day: number | null; // (HT − matière − déplacement) / jours
  deposit: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Prix de vente HT au m² d'une référence : prix fixé, sinon achat × (1 + pertes) × (1 + marge). */
export function productSalePrice(product: Product, settings: PricingSettings) {
  if (product.sale_price_m2) return round2(product.sale_price_m2);
  const purchase = product.purchase_price_m2 ?? 0;
  const waste = product.waste_rate ?? settings.default_waste_rate;
  return round2(purchase * (1 + waste) * (1 + settings.material_margin));
}

export function computeLine(line: LineInput, products: Map<string, Product>, settings: PricingSettings): ComputedLine {
  switch (line.kind) {
    case "matiere": {
      const product = products.get(line.product_id);
      const unitPrice = product ? productSalePrice(product, settings) : 0;
      const waste = product?.waste_rate ?? settings.default_waste_rate;
      const purchased = round2(line.surface_m2 * (1 + waste)); // m² achetés, pertes comprises
      return {
        kind: "matiere",
        product_id: product?.id ?? null,
        description: line.description || (product ? `${product.brand} ${product.reference} — ${product.name}` : "Revêtement"),
        quantity: round2(line.surface_m2),
        unit: "m²",
        unit_price_ht: unitPrice,
        total_ht: round2(line.surface_m2 * unitPrice),
        cost_ht: round2(purchased * (product?.purchase_price_m2 ?? 0)),
        details: { surface_m2: line.surface_m2, waste_rate: waste, purchased_m2: purchased, purchase_price_m2: product?.purchase_price_m2 ?? null },
      };
    }
    case "main_oeuvre":
      return {
        kind: "main_oeuvre",
        product_id: null,
        description: line.description || "Préparation des supports et pose",
        quantity: round2(line.days),
        unit: "jour",
        unit_price_ht: settings.day_rate,
        total_ht: round2(line.days * settings.day_rate),
        cost_ht: 0,
        details: { days: line.days },
      };
    case "deplacement":
      return {
        kind: "deplacement",
        product_id: null,
        description: line.description || "Déplacement",
        quantity: 1,
        unit: "forfait",
        unit_price_ht: round2(line.amount),
        total_ht: round2(line.amount),
        cost_ht: 0,
        details: {},
      };
    case "libre":
      return {
        kind: "libre",
        product_id: null,
        description: line.description,
        quantity: round2(line.quantity),
        unit: line.unit || "u",
        unit_price_ht: round2(line.unit_price),
        total_ht: round2(line.quantity * line.unit_price),
        cost_ht: 0,
        details: {},
      };
  }
}

export function computeTotals(lines: ComputedLine[], vatRate: number, depositRate: number): QuoteTotals {
  const total_ht = round2(lines.reduce((s, l) => s + l.total_ht, 0));
  const cost_ht = round2(lines.reduce((s, l) => s + l.cost_ht, 0));
  const travel = lines.filter((l) => l.kind === "deplacement").reduce((s, l) => s + l.total_ht, 0);
  const labour_days = round2(lines.filter((l) => l.kind === "main_oeuvre").reduce((s, l) => s + l.quantity, 0));
  const vat = round2((total_ht * vatRate) / 100);
  const total_ttc = round2(total_ht + vat);
  return {
    total_ht,
    vat,
    total_ttc,
    cost_ht,
    margin_ht: round2(total_ht - cost_ht),
    labour_days,
    earned_per_day: labour_days > 0 ? round2((total_ht - cost_ht - travel) / labour_days) : null,
    deposit: round2(total_ttc * depositRate),
  };
}

export const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
