// Importe les exports PDF « Liste des produits » de TEGO dans le catalogue de l'espace gérant.
//
//   npm run -s catalogue:tego -- <export.pdf> [<export2.pdf> …] --essai   → montre ce qui serait fait
//   npm run -s catalogue:tego -- <export.pdf> [<export2.pdf> …]           → importe
//
// Règles :
// - références arrêtées « (disc.) » : jamais ajoutées ; désactivées si elles étaient déjà au catalogue ;
// - prix d'achat HT mis à jour à chaque import ; unité : m² ou mètre linéaire (« EUR / m ») ;
// - le PRIX DE VENTE et les PERTES ne sont jamais modifiés : ils restent ceux fixés par le gérant ;
// - la largeur du rouleau n'est renseignée que pour les références vendues au m² (les autres : au chantier).
// Prérequis : migration 20261120000000_catalogue_unite_de_prix.sql appliquée (colonne price_unit).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dryRun = process.argv.includes("--essai");
if (!files.length) throw new Error("Indiquez au moins un export PDF TEGO.");

// Lecteur PDF installé dans C:\dev\outils (hors du site : il ne sert qu'à cet import)
const require = createRequire("C:/dev/outils/");
const pdfjs = await import("file:///" + require.resolve("pdfjs-dist/legacy/build/pdf.mjs").replace(/\\/g, "/"));

const COLS = ["marque", "collection", "famille", "sous_famille", "produit", "prix_unitaire", "prix_rouleau"];
const HEAD = ["Marque", "Collection", "Famille", "Sous-famille", "Produit", "Prix unitaire*", "Prix par"];

/** Lit le tableau d'un export : une ligne par article, cellules sur plusieurs lignes recollées. */
async function readExport(file) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(file)), useSystemFonts: true, verbosity: 0 }).promise;
  let starts = null; // abscisse de début de chaque colonne (d'après l'en-tête du tableau)
  let total = null;
  const rows = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const items = (await (await doc.getPage(p)).getTextContent()).items.filter((i) => i.str.trim());
    total ??= Number(items.map((i) => i.str).join(" ").match(/Total des articles:\s*(\d+)/)?.[1]) || null;
    const xs = HEAD.map((h) => items.find((i) => i.str.trim() === h)?.transform[4]);
    if (xs.every((x) => x !== undefined)) starts = xs;
    if (!starts) continue;
    const headerY = items.find((i) => i.str.trim() === "Marque")?.transform[5] ?? Infinity;
    const lines = new Map();
    for (const i of items) {
      const y = Math.round(i.transform[5]);
      if (y >= headerY - 25 || y < 60 || /Ce document est fourni|Prix hors TVA/.test(i.str)) continue;
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y).push(i);
    }
    for (const y of [...lines.keys()].sort((a, b) => b - a)) {
      const cells = Object.fromEntries(COLS.map((c) => [c, ""]));
      for (const i of lines.get(y)) {
        let col = 0;
        while (col < COLS.length - 1 && i.transform[4] >= starts[col + 1] - 2) col++;
        cells[COLS[col]] = `${cells[COLS[col]]} ${i.str}`.trim();
      }
      if (cells.marque) rows.push(cells);
      else if (rows.length) for (const c of COLS) if (cells[c]) rows.at(-1)[c] = `${rows.at(-1)[c]} ${cells[c]}`.replace(/- (\p{Ll})/gu, "$1");
    }
  }
  if (total !== null && rows.length !== total) throw new Error(`${file} : ${rows.length} lignes lues pour ${total} annoncées — import annulé.`);
  return rows;
}

const all = (await Promise.all(files.map(readExport))).flat();

// Correspondance avec le catalogue
const BRAND = { "Cover Styl": "Cover Styl'", "Solar Screen": "Solar Screen" };
const clean = (s) => s.replace(/\s*-?\s*\(disc\.?\)\s*/i, " ").replace(/\s+/g, " ").trim();
const code = (label) => label.split(" - ")[0].trim();
const codeCounts = new Map();
for (const r of all) {
  const k = `${r.marque}|${code(clean(r.produit))}`;
  codeCounts.set(k, (codeCounts.get(k) ?? 0) + 1);
}

const products = [];
const discontinued = [];
for (const r of all) {
  const label = clean(r.produit);
  const price = r.prix_unitaire.replace(/\s+/g, " ").match(/([\d.]+) ?EUR ?\/ ?(m²|m2|m)(?![\w²])/);
  if (!price) throw new Error(`Prix illisible : ${r.produit} (${r.prix_unitaire})`);
  const unit = price[2] === "m" ? "ml" : "m2";
  // Référence : le code (« WOB1 ») s'il est unique dans la marque et que la suite est un vrai nom (« Wood ») ;
  // sinon le libellé complet (« AURORA SUMMER - 135cm » : la suite n'est qu'une largeur de rouleau)
  const rest = label.includes(" - ") ? label.slice(label.indexOf(" - ") + 3) : "";
  const unique = codeCounts.get(`${r.marque}|${code(label)}`) === 1 && rest !== "" && !/^\d{2,3}\s*cm\b/i.test(rest);
  const reference = unique ? code(label) : label;
  const name = unique ? rest : label;
  const brand = BRAND[r.marque] ?? r.marque;
  if (/\(disc\.?\)/i.test(r.produit)) {
    discontinued.push({ brand, reference });
    continue;
  }
  const width = label.match(/(\d{2,3})\s*cm\b/);
  const glass = r.marque === "Solar Screen" || r.collection === "Glass";
  products.push({
    brand,
    reference: reference.slice(0, 120),
    name: name.slice(0, 120),
    category: r.famille || null,
    finish: r.sous_famille && r.sous_famille !== r.famille ? r.sous_famille : null,
    univers: glass ? ["glass", "pro"] : ["home", "pro", "boat"],
    roll_width_mm: unit === "m2" && width ? Number(width[1]) * 10 : null,
    purchase_price_m2: Number(price[1]),
    price_unit: unit,
    active: true,
    notes: `TEGO · collection ${r.collection}${r.prix_rouleau ? ` · rouleau complet ${r.prix_rouleau.replace(/\s+/g, " ")} HT` : ""}`,
  });
}

// Doublons éventuels (même marque + référence) : on garde la dernière occurrence
const byKey = new Map(products.map((p) => [`${p.brand}|${p.reference}`, p]));
const rows = [...byKey.values()];
const summary = {
  lus: all.length,
  a_importer: rows.length,
  arretees_ignorees: discontinued.length,
  par_marque: rows.reduce((a, p) => ({ ...a, [p.brand]: (a[p.brand] ?? 0) + 1 }), {}),
  par_unite: rows.reduce((a, p) => ({ ...a, [p.price_unit === "ml" ? "mètre linéaire" : "m²"]: (a[p.price_unit === "ml" ? "mètre linéaire" : "m²"] ?? 0) + 1 }), {}),
  exemples: rows.filter((_, i) => i % Math.max(1, Math.floor(rows.length / 5)) === 0).slice(0, 5).map((p) => `${p.brand} ${p.reference} — ${p.name} · ${p.purchase_price_m2} €/${p.price_unit === "ml" ? "m" : "m²"}`),
};
if (dryRun) {
  console.log(JSON.stringify({ essai: true, ...summary }, null, 2));
} else {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Variables Supabase absentes : lancer avec npm run -s catalogue:tego -- …");
  const db = createClient(url, key, { auth: { persistSession: false } });
  // Par paquets de 200 : prix de vente et pertes absents du paquet, donc jamais écrasés
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from("products").upsert(rows.slice(i, i + 200), { onConflict: "brand,reference" });
    if (error) throw new Error(`Import interrompu : ${error.message}`);
  }
  let deactivated = 0;
  for (const d of discontinued) {
    const { data } = await db.from("products").update({ active: false }).eq("brand", d.brand).eq("reference", d.reference).eq("active", true).select("id");
    deactivated += data?.length ?? 0;
  }
  console.log(JSON.stringify({ ...summary, importees: rows.length, arretees_desactivees: deactivated }, null, 2));
}
