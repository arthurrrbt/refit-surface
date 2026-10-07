-- Factures : acompte / solde, encaissements, immuabilité après émission, émission atomique

-- ─── Paramètres ────────────────────────────────────────────────────────────
alter table public.settings add column invoice_due_days integer not null default 0; -- 0 = payable à réception

-- ─── Factures ─────────────────────────────────────────────────────────────
alter table public.invoices
  add column kind text not null default 'globale' check (kind in ('acompte', 'solde', 'globale')),
  add column title text,
  add column service_date date,                                  -- date d'exécution des travaux
  add column amount_paid numeric(12, 2) not null default 0,
  add column notes text,
  add column operation_category text not null default 'Prestation de services (fourniture et pose)',
  add column client_snapshot jsonb,                              -- identité du client figée à l'émission
  add column share_token text unique,                            -- lien de téléchargement pour le client
  add column sent_at timestamptz;

alter table public.invoice_lines
  add column kind text not null default 'libre' check (kind in ('libre', 'acompte', 'deduction'));

-- ─── Encaissements ────────────────────────────────────────────────────────
create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  paid_on date not null,
  amount numeric(12, 2) not null check (amount <> 0),
  method text not null check (method in ('virement', 'cheque', 'especes', 'carte', 'autre')),
  reference text,
  created_at timestamptz not null default now()
);
create index on public.invoice_payments (invoice_id);
alter table public.invoice_payments enable row level security;
create policy "admin_all" on public.invoice_payments for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ─── Une facture émise ne se modifie plus (correction = avoir) ─────────────
create function public.protect_issued_invoice()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'brouillon' then
      raise exception 'Une facture émise ne peut pas être supprimée (établissez un avoir).';
    end if;
    return old;
  end if;
  if old.status <> 'brouillon' and (
    new.number is distinct from old.number
    or new.issued_at is distinct from old.issued_at
    or new.contact_id is distinct from old.contact_id
    or new.total_ht is distinct from old.total_ht
    or new.total_ttc is distinct from old.total_ttc
    or new.vat_rate is distinct from old.vat_rate
    or new.client_snapshot is distinct from old.client_snapshot
    or new.service_date is distinct from old.service_date
  ) then
    raise exception 'Une facture émise ne peut pas être modifiée (établissez un avoir).';
  end if;
  return new;
end;
$$;
create trigger invoices_protect before update or delete on public.invoices
  for each row execute function public.protect_issued_invoice();

create function public.protect_issued_invoice_lines()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  s public.invoice_status;
begin
  select status into s from public.invoices
  where id = coalesce(new.invoice_id, old.invoice_id);
  if s is not null and s <> 'brouillon' then
    raise exception 'Les lignes d''une facture émise ne peuvent pas être modifiées.';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger invoice_lines_protect before insert or update or delete on public.invoice_lines
  for each row execute function public.protect_issued_invoice_lines();

-- ─── Émission atomique : numéro continu + date + statut dans la même transaction ──
create function public.emit_invoice(p_invoice uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  n text;
begin
  if not public.is_admin() then
    raise exception 'Accès refusé';
  end if;
  if not exists (select 1 from public.invoices where id = p_invoice and status = 'brouillon') then
    raise exception 'Facture introuvable ou déjà émise';
  end if;
  n := public.next_document_number('facture');
  update public.invoices
  set number = n,
      issued_at = (now() at time zone 'Europe/Paris')::date,
      status = 'emise'
  where id = p_invoice;
  return n;
end;
$$;
