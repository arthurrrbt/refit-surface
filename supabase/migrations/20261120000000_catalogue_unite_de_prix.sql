-- Catalogue : unité de vente de chaque référence.
--   'm2' : prix au mètre carré (films Solar Screen, gamme Glass de Cover Styl')
--   'ml' : prix au mètre linéaire de rouleau (la plupart des Cover Styl') ; la largeur se choisit au chantier
-- Les colonnes purchase_price_m2 / sale_price_m2 contiennent alors le prix PAR UNITÉ (m² ou m linéaire) :
-- elles gardent leur nom pour ne pas casser les devis existants.
alter table public.products
  add column price_unit text not null default 'm2' check (price_unit in ('m2', 'ml'));

comment on column public.products.price_unit is 'Unité de prix : m2 (mètre carré) ou ml (mètre linéaire de rouleau)';
comment on column public.products.purchase_price_m2 is 'Prix d''achat HT par unité (voir price_unit)';
comment on column public.products.sale_price_m2 is 'Prix de vente HT par unité (voir price_unit) ; vide = à fixer';
