-- REFIT Surface — schéma initial
-- Sécurité : RLS activée partout ; seul un utilisateur listé dans app_admins accède aux données.
-- Les formulaires publics (devis, RDV) passent par des Server Actions avec la clé secrète, jamais en direct.

-- ─── Types ────────────────────────────────────────────────────────────────
create type public.univers as enum ('home', 'glass', 'pro', 'boat');
create type public.lead_status as enum ('nouveau', 'qualifie', 'rdv', 'devis_envoye', 'gagne', 'perdu');
create type public.quote_status as enum ('brouillon', 'envoye', 'signe', 'refuse', 'expire');
create type public.invoice_status as enum ('brouillon', 'emise', 'transmise', 'payee', 'annulee');
create type public.job_status as enum ('a_planifier', 'planifie', 'en_cours', 'termine');
create type public.event_kind as enum ('visite', 'metrage', 'pose', 'autre');
create type public.agent_run_status as enum ('propose', 'valide', 'rejete', 'execute', 'erreur');

-- ─── Administrateurs ──────────────────────────────────────────────────────
create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins where user_id = (select auth.uid()));
$$;

-- ─── Utilitaire updated_at ────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── CRM ──────────────────────────────────────────────────────────────────
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'particulier' check (kind in ('particulier', 'professionnel')),
  company text,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  siret text,
  marketing_consent boolean not null default false,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  univers public.univers,
  status public.lead_status not null default 'nouveau',
  source text check (source in ('site', 'telephone', 'recommandation', 'prospection', 'salon', 'autre')),
  message text,
  surfaces jsonb not null default '[]'::jsonb, -- [{ type, largeur_mm, hauteur_mm, quantite }]
  budget_estimate numeric(12, 2),
  ai_summary text,
  ai_score smallint check (ai_score between 0 and 100),
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.leads (contact_id);
create index on public.leads (status);

-- ─── Catalogue ────────────────────────────────────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand text not null, -- Cover Styl', Solar Screen…
  reference text not null,
  name text not null,
  category text,
  univers public.univers[] not null default '{}',
  finish text,
  roll_width_mm integer,
  purchase_price_m2 numeric(10, 2), -- prix d'achat TEGO
  sale_price_m2 numeric(10, 2),
  waste_rate numeric(4, 3) not null default 0.15, -- pertes matière
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand, reference)
);

-- ─── Chantiers ────────────────────────────────────────────────────────────
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete restrict,
  univers public.univers,
  title text not null,
  address text,
  status public.job_status not null default 'a_planifier',
  start_date date,
  end_date date,
  labour_days numeric(5, 2),
  materials_ordered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.jobs (contact_id);

create table public.lead_photos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete cascade,
  storage_path text not null,
  caption text,
  width_mm integer,
  height_mm integer,
  created_at timestamptz not null default now(),
  check (lead_id is not null or job_id is not null)
);

-- ─── Devis ────────────────────────────────────────────────────────────────
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text unique,
  lead_id uuid references public.leads (id) on delete set null,
  contact_id uuid not null references public.contacts (id) on delete restrict,
  job_id uuid references public.jobs (id) on delete set null,
  univers public.univers,
  status public.quote_status not null default 'brouillon',
  version integer not null default 1,
  issued_at date,
  valid_until date,
  labour_days numeric(5, 2),
  total_ht numeric(12, 2) not null default 0,
  vat_rate numeric(4, 2) not null default 20,
  total_ttc numeric(12, 2) not null default 0,
  notes text,
  signed_at timestamptz,
  signature_path text,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.quotes (contact_id);
create index on public.quotes (status);

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  position integer not null default 0,
  product_id uuid references public.products (id) on delete set null,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit text not null default 'm²',
  unit_price_ht numeric(10, 2) not null default 0,
  total_ht numeric(12, 2) generated always as (round(quantity * unit_price_ht, 2)) stored
);
create index on public.quote_lines (quote_id);

-- ─── Factures ─────────────────────────────────────────────────────────────
-- La numérotation doit être chronologique et continue (sans trou) : attribuée à l'émission, phase 3.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text unique,
  quote_id uuid references public.quotes (id) on delete restrict,
  contact_id uuid not null references public.contacts (id) on delete restrict,
  status public.invoice_status not null default 'brouillon',
  issued_at date,
  due_at date,
  total_ht numeric(12, 2) not null default 0,
  vat_rate numeric(4, 2) not null default 20,
  total_ttc numeric(12, 2) not null default 0,
  pa_reference text, -- identifiant chez la plateforme agréée
  paid_at timestamptz,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.invoices (contact_id);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  position integer not null default 0,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit text not null default 'm²',
  unit_price_ht numeric(10, 2) not null default 0,
  total_ht numeric(12, 2) generated always as (round(quantity * unit_price_ht, 2)) stored
);
create index on public.invoice_lines (invoice_id);

-- ─── Planning & relances ──────────────────────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  kind public.event_kind not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  lead_id uuid references public.leads (id) on delete set null,
  job_id uuid references public.jobs (id) on delete set null,
  location text,
  outlook_event_id text unique,
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on public.events (starts_at);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  quote_id uuid references public.quotes (id) on delete cascade,
  step text not null check (step in ('J+3', 'J+7', 'J+15', 'autre')),
  due_at timestamptz not null,
  channel text not null default 'email' check (channel in ('email', 'sms', 'telephone')),
  draft text,
  status text not null default 'a_faire' check (status in ('a_faire', 'envoye', 'annule')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.followups (due_at) where status = 'a_faire';

-- ─── Agents IA ────────────────────────────────────────────────────────────
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null, -- qualification, devis, relances, pilotage, planning, marketing, prospection
  status public.agent_run_status not null default 'propose',
  input jsonb,
  output jsonb,
  target_table text,
  target_id uuid,
  validated_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index on public.agent_runs (status, created_at desc);

-- ─── Réalisations publiées sur le site ────────────────────────────────────
create table public.gallery_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  univers public.univers not null,
  city text,
  description text,
  before_path text,
  after_path text,
  job_id uuid references public.jobs (id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── Triggers updated_at ──────────────────────────────────────────────────
create trigger contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger quotes_updated_at before update on public.quotes for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'contacts', 'leads', 'products', 'jobs', 'lead_photos', 'quotes', 'quote_lines',
    'invoices', 'invoice_lines', 'events', 'followups', 'agent_runs', 'gallery_projects'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "admin_all" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      t
    );
  end loop;
end;
$$;

create policy "admin_read_self" on public.app_admins for select to authenticated using (user_id = (select auth.uid()));

-- Le site public lit les réalisations publiées
create policy "public_read_published" on public.gallery_projects for select to anon using (published);

-- ─── Stockage ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('lead-photos', 'lead-photos', false),
  ('documents', 'documents', false),
  ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "admin_storage_all" on storage.objects for all to authenticated
  using (bucket_id in ('lead-photos', 'documents', 'gallery') and (select public.is_admin()))
  with check (bucket_id in ('lead-photos', 'documents', 'gallery') and (select public.is_admin()));
