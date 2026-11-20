import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Package, Plus, Search } from "lucide-react";
import { getSettings, listProducts } from "@/lib/quotes/data";
import { euro, productSalePrice, unitLabel } from "@/lib/quotes/pricing";
import { PendingButton } from "../agents/ui";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { toggleProduct } from "./actions";
import { ProductForm } from "./ProductForm";

export const metadata: Metadata = { title: "Catalogue" };

const PAGE_SIZE = 50;
type Params = { q?: string; marque?: string; afixer?: string; inactives?: string; page?: string };

export default function CataloguePage({ searchParams }: { searchParams: Promise<Params> }) {
  return (
    <>
      <PageHeader title="Catalogue">
        Références Cover Styl&apos; et Solar Screen avec vos prix d&apos;achat TEGO. Les prix de vente se fixent
        référence par référence ; tant qu&apos;un prix n&apos;est pas fixé, le devis le calcule depuis l&apos;achat et votre marge.
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <Catalogue searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function Catalogue({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const [all, settings] = await Promise.all([listProducts(true), getSettings()]);

  // Filtres : texte (référence, nom, catégorie, finition), marque, prix à fixer, références désactivées
  const q = norm(params.q?.trim() ?? "");
  const brands = [...new Set(all.map((p) => p.brand))].sort();
  const filtered = all.filter(
    (p) =>
      (params.inactives === "1" || p.active) &&
      (!params.marque || p.brand === params.marque) &&
      (params.afixer !== "1" || !p.sale_price_m2) &&
      (!q || norm(`${p.brand} ${p.reference} ${p.name} ${p.category ?? ""} ${p.finish ?? ""}`).includes(q)),
  );
  const toFix = all.filter((p) => p.active && !p.sale_price_m2).length;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const href = (patch: Partial<Params>) => {
    const next = new URLSearchParams(Object.entries({ ...params, page: undefined, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = next.toString();
    return s ? `/app/catalogue?${s}` : "/app/catalogue";
  };

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <details className="rounded-sm bg-paper p-5 shadow-sm" open={!all.length}>
        <summary className="flex cursor-pointer list-none items-center gap-2 font-display font-semibold [&::-webkit-details-marker]:hidden">
          <Plus className="size-4" /> Nouvelle référence
        </summary>
        <div className="mt-4">
          <ProductForm defaultWaste={settings.default_waste_rate} />
        </div>
      </details>

      <form className="flex flex-wrap items-end gap-3 rounded-sm bg-paper p-4 shadow-sm" action="/app/catalogue">
        <label className="min-w-56 flex-1 text-xs font-semibold">
          Rechercher
          <span className="mt-1 flex items-center gap-2 rounded-sm border border-ink/15 bg-paper px-3 py-2">
            <Search className="size-4 text-ink/40" aria-hidden />
            <input name="q" defaultValue={params.q ?? ""} placeholder="WOB1, chêne, CLEAR 4 C, marbre…" className="w-full bg-transparent text-sm font-normal focus:outline-none" />
          </span>
        </label>
        <label className="text-xs font-semibold">
          Marque
          <select name="marque" defaultValue={params.marque ?? ""} className="mt-1 block rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm font-normal">
            <option value="">Toutes</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="afixer" value="1" defaultChecked={params.afixer === "1"} /> Prix de vente à fixer ({toFix})
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="inactives" value="1" defaultChecked={params.inactives === "1"} /> Inclure les désactivées
        </label>
        <button type="submit" className="rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-paper">
          Filtrer
        </button>
      </form>

      <p className="text-sm text-ink/60">
        {filtered.length} référence{filtered.length > 1 ? "s" : ""}
        {filtered.length !== all.length && ` sur ${all.length}`}
        {pages > 1 && ` · page ${page} sur ${pages}`}
      </p>

      {shown.length ? (
        <ul className="space-y-2">
          {shown.map((p) => {
            const unit = unitLabel(p.price_unit);
            return (
              <li key={p.id} className={`rounded-sm bg-paper shadow-sm ${p.active ? "" : "opacity-60"}`}>
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm [&::-webkit-details-marker]:hidden">
                    <span className="font-semibold">
                      {p.brand} {p.reference}
                    </span>
                    {p.name !== p.reference && <span className="text-ink/70">{p.name}</span>}
                    {p.category && <span className="rounded-full bg-mist px-2 py-0.5 text-xs">{p.category}</span>}
                    <span className="ml-auto text-xs text-ink/60">
                      achat {p.purchase_price_m2 != null ? euro.format(p.purchase_price_m2) : "—"} → vente{" "}
                      {p.sale_price_m2 ? (
                        <strong className="text-ink">{euro.format(p.sale_price_m2)}</strong>
                      ) : (
                        <span className="text-amber-700">à fixer (calculé : {euro.format(productSalePrice(p, settings))})</span>
                      )}{" "}
                      / {unit}
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
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-sm bg-paper p-10 text-center text-ink/60 shadow-sm">
          <Package className="size-8 text-ink/30" />
          <p className="mt-3">{all.length ? "Aucune référence ne correspond à ces filtres." : "Catalogue vide : ajoutez vos références les plus utilisées."}</p>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages du catalogue" className="flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: String(n) })}
              aria-current={n === page ? "page" : undefined}
              className={`rounded-sm px-3 py-1.5 text-sm ${n === page ? "bg-ink text-paper" : "bg-paper shadow-sm hover:bg-mist"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
