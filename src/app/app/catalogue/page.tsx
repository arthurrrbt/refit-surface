import type { Metadata } from "next";
import { Suspense } from "react";
import { Package, Plus } from "lucide-react";
import { getSettings, listProducts } from "@/lib/quotes/data";
import { euro, productSalePrice } from "@/lib/quotes/pricing";
import { PendingButton } from "../agents/ui";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { toggleProduct } from "./actions";
import { ProductForm } from "./ProductForm";

export const metadata: Metadata = { title: "Catalogue" };

export default function CataloguePage() {
  return (
    <>
      <PageHeader title="Catalogue">Références Cover Styl&apos; et Solar Screen avec vos prix d&apos;achat TEGO.</PageHeader>
      <Suspense fallback={<Loading />}>
        <Catalogue />
      </Suspense>
    </>
  );
}

async function Catalogue() {
  const [products, settings] = await Promise.all([listProducts(true), getSettings()]);

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <details className="rounded-sm bg-paper p-5 shadow-sm" open={!products.length}>
        <summary className="flex cursor-pointer list-none items-center gap-2 font-display font-semibold [&::-webkit-details-marker]:hidden">
          <Plus className="size-4" /> Nouvelle référence
        </summary>
        <div className="mt-4">
          <ProductForm defaultWaste={settings.default_waste_rate} />
        </div>
      </details>

      {products.length ? (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className={`rounded-sm bg-paper shadow-sm ${p.active ? "" : "opacity-60"}`}>
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold">
                    {p.brand} {p.reference}
                  </span>
                  <span className="text-ink/70">{p.name}</span>
                  {p.category && <span className="rounded-full bg-mist px-2 py-0.5 text-xs">{p.category}</span>}
                  <span className="ml-auto text-xs text-ink/60">
                    achat {p.purchase_price_m2 != null ? euro.format(p.purchase_price_m2) : "—"} → vente{" "}
                    <strong className="text-ink">{euro.format(productSalePrice(p, settings))}</strong> / m²
                    {!p.active && " · désactivée"}
                  </span>
                </summary>
                <div className="space-y-4 border-t border-ink/10 p-4">
                  <ProductForm product={p} defaultWaste={settings.default_waste_rate} />
                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={String(!p.active)} />
                    <PendingButton>{p.active ? "Désactiver (ne plus proposer dans les devis)" : "Réactiver"}</PendingButton>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-sm bg-paper p-10 text-center text-ink/60 shadow-sm">
          <Package className="size-8 text-ink/30" />
          <p className="mt-3">Catalogue vide : ajoutez vos références les plus utilisées.</p>
        </div>
      )}
    </div>
  );
}
