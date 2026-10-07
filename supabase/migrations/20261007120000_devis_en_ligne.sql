-- Formulaire de devis en ligne

-- Détails propres à chaque univers (objectifs vitrage, finitions, délai…)
alter table public.leads add column details jsonb not null default '{}'::jsonb;

-- Preuve du consentement RGPD donné dans le formulaire
alter table public.contacts add column privacy_consent_at timestamptz;

-- Recherche des contacts par e-mail (déduplication)
create index contacts_email_lower_idx on public.contacts (lower(email));

-- Photos des demandes : 10 Mo maximum, images uniquement
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'lead-photos';
