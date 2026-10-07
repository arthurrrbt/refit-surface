-- Une facture émise ne peut jamais redevenir un brouillon (elle redeviendrait modifiable et supprimable).

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
