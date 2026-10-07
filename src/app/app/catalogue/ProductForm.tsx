"use client";

import { useActionState } from "react";
import type { Product } from "@/lib/quotes/pricing";
import { PendingButton } from "../agents/ui";
import { saveProduct, type ProductState } from "./actions";

const field = "mt-1 block w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";

export function ProductForm({ product, defaultWaste }: { product?: Product; defaultWaste: number }) {
  const [state, action] = useActionState<ProductState, FormData>(saveProduct, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <label className="text-xs font-semibold sm:col-span-2">
        Marque
        <input name="brand" required list="brands" defaultValue={product?.brand ?? "Cover Styl'"} className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-2">
        Référence
        <input name="reference" required defaultValue={product?.reference} placeholder="NH12" className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-2">
        Catégorie
        <input name="category" list="categories" defaultValue={product?.category ?? ""} placeholder="Bois" className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-3">
        Nom
        <input name="name" required defaultValue={product?.name} placeholder="Chêne naturel" className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-3">
        Finition
        <input name="finish" defaultValue={product?.finish ?? ""} placeholder="Mat, structuré…" className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-2">
        Prix d&apos;achat TEGO (€ HT / m²)
        <input type="number" name="purchase_price_m2" step="0.01" min={0} defaultValue={product?.purchase_price_m2 ?? ""} className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-2">
        Pertes (%)
        <input type="number" name="waste_rate" step="0.5" min={0} required defaultValue={Math.round((product?.waste_rate ?? defaultWaste) * 1000) / 10} className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-2">
        Prix de vente imposé (€ HT / m²)
        <input type="number" name="sale_price_m2" step="0.01" min={0} defaultValue={product?.sale_price_m2 ?? ""} placeholder="Sinon calculé" className={field} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-6">
        <PendingButton variant="primary" pendingLabel="Enregistrement…">
          {product ? "Enregistrer" : "Ajouter la référence"}
        </PendingButton>
        {state.ok && <p className="text-sm text-emerald-700">Enregistré.</p>}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
      <datalist id="brands">
        <option value="Cover Styl'" />
        <option value="Solar Screen" />
      </datalist>
      <datalist id="categories">
        {["Bois", "Marbre", "Béton / pierre", "Uni", "Métal", "Cuir / textile", "Film solaire", "Film intimité", "Film sécurité"].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </form>
  );
}
