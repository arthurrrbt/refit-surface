-- À exécuter UNE fois dans Supabase → SQL Editor, après avoir créé votre compte
-- dans Authentication → Users → « Add user » (e-mail + mot de passe, « Auto confirm »).
-- Remplacez l'adresse ci-dessous par la vôtre.

insert into public.app_admins (user_id)
select id from auth.users where email = 'votre-adresse@exemple.fr'
on conflict do nothing;
