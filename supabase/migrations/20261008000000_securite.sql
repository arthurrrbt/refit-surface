-- Audit de sécurité : limitation de débit des formulaires publics et réduction de l'exposition anonyme.

-- ─── Limitation de débit (rate limiting) ───────────────────────────────────
-- Compteur par clé (action + empreinte de l'IP) sur une fenêtre fixe.
-- Incrément atomique (insert … on conflict) : deux requêtes simultanées ne peuvent pas contourner la limite.
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 1
);
alter table public.rate_limits enable row level security; -- aucune politique : serveur uniquement

create function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  h integer;
  expired timestamptz := now() - make_interval(secs => p_window_seconds);
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < expired then 1 else r.hits + 1 end,
        window_start = case when r.window_start < expired then now() else r.window_start end
  returning hits into h;

  -- Ménage occasionnel des compteurs périmés
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;

  return h <= p_max;
end;
$$;

-- Appelable uniquement avec la clé secrète du serveur (jamais depuis le navigateur)
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;

-- ─── Galerie publique : colonnes strictement nécessaires ───────────────────
-- Le visiteur anonyme ne voit plus l'identifiant interne du chantier (job_id).
revoke select on public.gallery_projects from anon;
grant select (id, slug, title, univers, city, description, before_path, after_path, published, published_at, created_at)
  on public.gallery_projects to anon;
