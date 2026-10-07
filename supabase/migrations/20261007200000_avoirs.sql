-- Avoirs : facture rectificative liée à une facture émise, numérotation continue A-AAAA-0001

-- ─── Numérotation : nouvelle série « avoir » ──────────────────────────────
alter table public.document_counters drop constraint if exists document_counters_kind_check;
alter table public.document_counters add constraint document_counters_kind_check check (kind in ('devis', 'facture', 'avoir'));

create or replace function public.next_document_number(p_kind text)
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
  return case p_kind when 'devis' then 'D' when 'avoir' then 'A' else 'F' end || '-' || y || '-' || lpad(n::text, 4, '0');
end;
$$;

-- ─── Avoirs dans le registre des factures ─────────────────────────────────
alter table public.invoices drop constraint if exists invoices_kind_check;
alter table public.invoices add constraint invoices_kind_check check (kind in ('acompte', 'solde', 'globale', 'avoir'));

alter table public.invoices
  add column credited_invoice_id uuid references public.invoices (id) on delete restrict, -- facture corrigée
  add column amount_imputed numeric(12, 2) not null default 0;                            -- part de l'avoir imputée sur la facture

alter table public.invoices
  add constraint invoices_avoir_reference check ((kind = 'avoir') = (credited_invoice_id is not null));
create index on public.invoices (credited_invoice_id);

-- ─── Protection : on ajoute la facture d'origine aux champs figés ─────────
create or replace function public.protect_issued_invoice()
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
  if old.status <> 'brouillon' and new.status = 'brouillon' then
    raise exception 'Une facture émise ne peut pas redevenir un brouillon (établissez un avoir).';
  end if;
  if old.status <> 'brouillon' and (
    new.number is distinct from old.number
    or new.kind is distinct from old.kind
    or new.issued_at is distinct from old.issued_at
    or new.contact_id is distinct from old.contact_id
    or new.total_ht is distinct from old.total_ht
    or new.total_ttc is distinct from old.total_ttc
    or new.vat_rate is distinct from old.vat_rate
    or new.client_snapshot is distinct from old.client_snapshot
    or new.service_date is distinct from old.service_date
    or new.credited_invoice_id is distinct from old.credited_invoice_id
  ) then
    raise exception 'Une facture émise ne peut pas être modifiée (établissez un avoir).';
  end if;
  return new;
end;
$$;

-- ─── Émission : série « avoir » ou « facture » selon le document ──────────
create or replace function public.emit_invoice(p_invoice uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  k text;
  n text;
begin
  if not public.is_admin() then
    raise exception 'Accès refusé';
  end if;
  select kind into k from public.invoices where id = p_invoice and status = 'brouillon';
  if k is null then
    raise exception 'Facture introuvable ou déjà émise';
  end if;
  n := public.next_document_number(case when k = 'avoir' then 'avoir' else 'facture' end);
  update public.invoices
  set number = n,
      issued_at = (now() at time zone 'Europe/Paris')::date,
      status = 'emise'
  where id = p_invoice;
  return n;
end;
$$;
