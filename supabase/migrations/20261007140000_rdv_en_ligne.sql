-- Prise de rendez-vous en ligne

-- Distingue les rendez-vous réservés par les clients sur le site
alter table public.events add column booked_online boolean not null default false;

-- Deux réservations en ligne ne peuvent jamais se chevaucher (protection contre les doubles clics simultanés)
alter table public.events
  add constraint events_no_overlap_online
  exclude using gist (tstzrange(starts_at, ends_at) with &&)
  where (booked_online);
