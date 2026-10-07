-- Suivi des chantiers : lien devis, matière à commander, photos par étape

alter table public.jobs
  add column quote_id uuid unique references public.quotes (id) on delete set null,
  add column lead_id uuid references public.leads (id) on delete set null,
  add column started_at timestamptz,
  add column finished_at timestamptz;

-- Matière à commander (calculée depuis le devis : surface + pertes)
create table public.job_materials (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  description text not null,
  quantity_m2 numeric(10, 2) not null default 0,
  status text not null default 'a_commander' check (status in ('a_commander', 'commande', 'recu')),
  ordered_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.job_materials (job_id);
alter table public.job_materials enable row level security;
create policy "admin_all" on public.job_materials for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Photos de chantier : étape avant / pendant / après
alter table public.lead_photos
  add column stage text check (stage in ('avant', 'pendant', 'apres'));

create index on public.lead_photos (job_id);
create index on public.events (job_id);
