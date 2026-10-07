"use client";

import { useMemo, useState } from "react";
import { Calculator, Hammer, Loader2, Package, Plus, Trash2, Truck, Type } from "lucide-react";
import type { QuoteLineRow } from "@/lib/quotes/data";
import { computeLine, computeTotals, euro, type LineInput, type PricingSettings, type Product } from "@/lib/quotes/pricing";
import { saveQuote } from "./actions";

type EditableLine = LineInput & { key: string };

const field = "block w-full rounded-sm border border-ink/15 bg-paper px-2.5 py-2 text-sm focus:border-accent focus:outline-none";

let counter = 0;
const newKey = () => `l${++counter}`;

function fromRow(row: QuoteLineRow): EditableLine {
  const key = row.id;
  switch (row.kind) {
    case "matiere":
      return { key, kind: "matiere", product_id: row.product_id ?? "", description: row.description, surface_m2: Number(row.details.surface_m2 ?? row.quantity) };
    case "main_oeuvre":
      return { key, kind: "main_oeuvre", description: row.description, days: row.quantity };
    case "deplacement":
      return { key, kind: "deplacement", description: row.description, amount: row.unit_price_ht };
    default:
      return { key, kind: "libre", description: row.description, quantity: row.quantity, unit: row.unit, unit_price: row.unit_price_ht };
  }
}

const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function QuoteEditor({
  quoteId,
  initialTitle,
  initialNotes,
  initialLines,
  products,
  settings,
  vatRate,
  depositRate,
}: {
  quoteId: string;
  initialTitle: string;
  initialNotes: string;
  initialLines: QuoteLineRow[];
  products: Product[];
  settings: PricingSettings;
  vatRate: number;
  depositRate: number;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);
  const [lines, setLines] = useState<EditableLine[]>(() => initialLines.map(fromRow));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [dimsFor, setDimsFor] = useState<string | null>(null);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const computed = lines.map((l) => computeLine(l, productMap, settings));
  const totals = computeTotals(computed, vatRate, depositRate);
  const brands = [...new Set(products.map((p) => p.brand))];

  function update(key: string, patch: Partial<EditableLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? ({ ...l, ...patch } as EditableLine) : l)));
    setMessage(null);
  }
  function add(line: LineInput) {
    setLines((prev) => [...prev, { ...line, key: newKey() } as EditableLine]);
  }

  async function save() {
    setSaving(true);
    const result = await saveQuote({
      id: quoteId,
      title,
      notes,
      lines: lines.map((l) => Object.fromEntries(Object.entries(l).filter(([k]) => k !== "key")) as LineInput),
    });
    setSaving(false);
    setMessage(result.ok ? { ok: true, text: "Devis enregistré." } : { ok: false, text: result.error });
  }

  const missingProduct = lines.some((l) => l.kind === "matiere" && !l.product_id);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-sm bg-paper p-4 shadow-sm">
        <label className="block text-xs font-semibold">
          Objet du devis
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mt-1`} />
        </label>
      </div>

      <ul className="space-y-2">
        {lines.map((l, i) => {
          const c = computed[i];
          return (
            <li key={l.key} className="rounded-sm bg-paper p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-12">
                  {l.kind === "matiere" && (
                    <>
                      <select
                        aria-label="Référence"
                        value={l.product_id}
                        onChange={(e) => update(l.key, { product_id: e.target.value })}
                        className={`${field} sm:col-span-5 ${l.product_id ? "" : "border-amber-400"}`}
                      >
                        <option value="">Choisir une référence…</option>
                        {brands.map((b) => (
                          <optgroup key={b} label={b}>
                            {products
                              .filter((p) => p.brand === b && (p.active || p.id === l.product_id))
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.reference} — {p.name}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                      <input
                        aria-label="Désignation"
                        value={l.description}
                        onChange={(e) => update(l.key, { description: e.target.value })}
                        placeholder="Façades de cuisine"
                        className={`${field} sm:col-span-4`}
                      />
                      <div className="flex items-center gap-1 sm:col-span-3">
                        <input
                          aria-label="Surface en m²"
                          inputMode="decimal"
                          value={l.surface_m2 || ""}
                          onChange={(e) => update(l.key, { surface_m2: num(e.target.value) })}
                          className={field}
                        />
                        <span className="text-xs text-ink/60">m²</span>
                        <button type="button" onClick={() => setDimsFor(dimsFor === l.key ? null : l.key)} aria-label="Calculer la surface" className="p-1.5 text-ink/60 hover:text-ink">
                          <Calculator className="size-4" />
                        </button>
                      </div>
                      {dimsFor === l.key && <DimsHelper onApply={(m2) => { update(l.key, { surface_m2: m2 }); setDimsFor(null); }} />}
                    </>
                  )}
                  {l.kind === "main_oeuvre" && (
                    <>
                      <input
                        aria-label="Désignation"
                        value={l.description}
                        onChange={(e) => update(l.key, { description: e.target.value })}
                        placeholder="Préparation des supports et pose"
                        className={`${field} sm:col-span-9`}
                      />
                      <div className="flex items-center gap-1 sm:col-span-3">
                        <input aria-label="Jours" inputMode="decimal" value={l.days || ""} onChange={(e) => update(l.key, { days: num(e.target.value) })} className={field} />
                        <span className="text-xs text-ink/60">jour(s)</span>
                      </div>
                    </>
                  )}
                  {l.kind === "deplacement" && (
                    <>
                      <input aria-label="Désignation" value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} placeholder="Déplacement" className={`${field} sm:col-span-9`} />
                      <div className="flex items-center gap-1 sm:col-span-3">
                        <input aria-label="Montant" inputMode="decimal" value={l.amount || ""} onChange={(e) => update(l.key, { amount: num(e.target.value) })} className={field} />
                        <span className="text-xs text-ink/60">€ HT</span>
                      </div>
                    </>
                  )}
                  {l.kind === "libre" && (
                    <>
                      <input aria-label="Désignation" value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} placeholder="Dépose des poignées, fourniture…" className={`${field} sm:col-span-6`} />
                      <input aria-label="Quantité" inputMode="decimal" value={l.quantity || ""} onChange={(e) => update(l.key, { quantity: num(e.target.value) })} className={`${field} sm:col-span-2`} />
                      <input aria-label="Unité" value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} className={`${field} sm:col-span-1`} />
                      <input aria-label="Prix unitaire HT" inputMode="decimal" value={l.unit_price || ""} onChange={(e) => update(l.key, { unit_price: num(e.target.value) })} placeholder="PU HT" className={`${field} sm:col-span-3`} />
                    </>
                  )}
                </div>
                <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))} aria-label="Supprimer la ligne" className="p-2 text-ink/60 hover:text-red-600">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-right text-xs text-ink/60">
                {c.quantity} {c.unit} × {euro.format(c.unit_price_ht)} = <strong className="text-ink">{euro.format(c.total_ht)} HT</strong>
                {c.kind === "matiere" && c.cost_ht > 0 && (
                  <span className="ml-2 text-ink/60">
                    (achat {euro.format(c.cost_ht)} pour {String(c.details.purchased_m2)} m² pertes incluses)
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-2">
        <AddButton icon={Package} label="Revêtement" onClick={() => add({ kind: "matiere", product_id: "", description: "", surface_m2: 0 })} />
        <AddButton icon={Hammer} label="Main d'œuvre" onClick={() => add({ kind: "main_oeuvre", description: "", days: 1 })} />
        <AddButton icon={Truck} label="Déplacement" onClick={() => add({ kind: "deplacement", description: "", amount: settings.travel_fee })} />
        <AddButton icon={Type} label="Ligne libre" onClick={() => add({ kind: "libre", description: "", quantity: 1, unit: "u", unit_price: 0 })} />
      </div>

      <label className="block rounded-sm bg-paper p-4 text-xs font-semibold shadow-sm">
        Remarques imprimées sur le devis
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${field} mt-1`} placeholder="Teinte validée sur échantillon, accès au chantier…" />
      </label>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-sm bg-paper p-4 text-sm shadow-sm">
          <Row label="Total HT" value={euro.format(totals.total_ht)} />
          <Row label={`TVA ${vatRate} %`} value={euro.format(totals.vat)} />
          <Row label="Total TTC" value={euro.format(totals.total_ttc)} strong />
          <Row label={`Acompte ${Math.round(depositRate * 100)} %`} value={euro.format(totals.deposit)} />
        </div>
        <div className="rounded-sm bg-ink p-4 text-sm text-paper shadow-sm">
          <p className="eyebrow text-accent">Rentabilité — visible par vous seul</p>
          <Row label="Coût matière (achat TEGO, pertes incluses)" value={euro.format(totals.cost_ht)} />
          <Row label="Marge brute HT" value={euro.format(totals.margin_ht)} />
          <Row label="Jours de pose" value={String(totals.labour_days)} />
          <Row
            label="Gagné par jour de pose"
            value={totals.earned_per_day != null ? euro.format(totals.earned_per_day) : "—"}
            strong
            tone={totals.earned_per_day != null && totals.earned_per_day < settings.day_rate ? "text-amber-300" : "text-emerald-300"}
          />
          <p className="mt-2 text-xs text-paper/50">Objectif : au moins {euro.format(settings.day_rate)} par jour (taux journalier).</p>
        </div>
      </div>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-sm bg-paper/95 p-3 shadow-md backdrop-blur lg:bottom-4">
        <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-sm bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-60">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Enregistrer le devis
        </button>
        {missingProduct && <p className="text-xs text-amber-700">Choisissez une référence pour chaque revêtement.</p>}
        {message && <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>}
      </div>
    </div>
  );
}

function AddButton({ icon: Icon, label, onClick }: { icon: typeof Package; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm hover:border-ink/40">
      <Plus className="size-3.5" />
      <Icon className="size-4" /> {label}
    </button>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <p className={`flex justify-between gap-4 py-1 ${strong ? "font-semibold" : ""}`}>
      <span className="opacity-80">{label}</span>
      <span className={tone}>{value}</span>
    </p>
  );
}

/** Petit calculateur largeur × hauteur × quantité → m². */
function DimsHelper({ onApply }: { onApply: (m2: number) => void }) {
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [q, setQ] = useState("1");
  const m2 = Math.round(((num(w) * num(h) * (num(q) || 1)) / 10000) * 100) / 100;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-sm bg-mist p-2 text-xs sm:col-span-12">
      <input aria-label="Largeur en cm" placeholder="Larg. cm" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} className={`${field} w-24`} />
      ×
      <input aria-label="Hauteur en cm" placeholder="Haut. cm" inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} className={`${field} w-24`} />
      ×
      <input aria-label="Quantité" placeholder="Qté" inputMode="numeric" value={q} onChange={(e) => setQ(e.target.value)} className={`${field} w-16`} />
      = <strong>{m2} m²</strong>
      <button type="button" onClick={() => onApply(m2)} className="rounded-sm bg-ink px-3 py-1.5 font-semibold text-paper">
        Appliquer
      </button>
    </div>
  );
}
