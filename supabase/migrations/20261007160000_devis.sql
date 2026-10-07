-- Devis : paramètres de chiffrage, numérotation continue, détail des lignes, signature électronique

-- ─── Paramètres de chiffrage (une seule ligne) ────────────────────────────
create table public.settings (
  id boolean primary key default true check (id),
  day_rate numeric(10, 2) not null default 450,          -- taux journalier de pose HT
  material_margin numeric(5, 3) not null default 0.35,   -- marge sur la matière (0.35 = 35 %)
  default_waste_rate numeric(4, 3) not null default 0.15, -- pertes matière par défaut
  travel_fee numeric(10, 2) not null default 0,          -- frais de déplacement HT par défaut
  vat_rate numeric(4, 2) not null default 20,
  quote_validity_days integer not null default 30,
  deposit_rate numeric(4, 3) not null default 0.30,      -- acompte demandé à la signature
  updated_at timestamptz not null default now()
);
insert into public.settings default values;
alter table public.settings enable row level security;
create policy "admin_all" on public.settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create trigger settings_updated_at before update on public.settings for each row execute function public.set_updated_at();

-- ─── Numérotation chronologique et continue (devis D-AAAA-0001, factures F-AAAA-0001) ──
create table public.document_counters (
  kind text not null check (kind in ('devis', 'facture')),
  year integer not null,
  last_value integer not null,
  primary key (kind, year)
);
alter table public.document_counters enable row level security;

create function public.next_document_number(p_kind text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  y integer := extract(year from (now() at time zone 'Europe/Paris'))::integer;
  n integer;
begin
  if not public.is_admin() then
    raise exception 'Accès refusé';
  end if;
  insert into public.document_counters as c (kind, year, last_value)
  values (p_kind, y, 1)
  on conflict (kind, year) do update set last_value = c.last_value + 1
  returning c.last_value into n;
  return case p_kind when 'devis' then 'D' else 'F' end || '-' || y || '-' || lpad(n::text, 4, '0');
end;
$$;

-- ─── Lignes de devis : nature et coût interne ──────────────────────────────
alter table public.quote_lines
  add column kind text not null default 'libre' check (kind in ('matiere', 'main_oeuvre', 'deplacement', 'libre')),
  add column cost_ht numeric(12, 2) not null default 0,   -- coût d'achat (jamais affiché au client)
  add column details jsonb not null default '{}'::jsonb;  -- surface, pertes, prix d'achat…

-- ─── Devis : contenu, marge et signature électronique ──────────────────────
alter table public.quotes
  add column title text,
  add column deposit_rate numeric(4, 3),
  add column total_cost_ht numeric(12, 2) not null default 0,
  add column sign_token text unique,
  add column sent_at timestamptz,
  add column pdf_sha256 text,
  add column signer_name text,
  add column signature_meta jsonb,   -- horodatage, IP, navigateur, empreintes
  add column signed_pdf_path text;
