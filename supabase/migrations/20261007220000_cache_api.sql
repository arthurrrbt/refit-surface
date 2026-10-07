-- Cache des données externes (météo, géocodage, itinéraires).
-- Sert à ne pas dépasser les limites des API et à afficher la dernière valeur connue si une source tombe.
-- Accès réservé au serveur (clé secrète) : RLS activée, aucune politique.
create table public.api_cache (
  key text primary key,
  value jsonb not null,
  source text not null,
  fetched_at timestamptz not null default now()
);

alter table public.api_cache enable row level security;

create index api_cache_fetched_at_idx on public.api_cache (fetched_at);
