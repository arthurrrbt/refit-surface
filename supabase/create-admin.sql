-- À exécuter dans Supabase → SQL Editor, après avoir créé votre compte
-- dans Authentication → Users → « Add user » (e-mail + mot de passe, « Auto confirm »).
-- Remplacez l'adresse ci-dessous par la vôtre (la casse n'a pas d'importance).

insert into public.app_admins (user_id)
select id from auth.users where lower(email) = lower('votre-adresse@exemple.fr')
on conflict do nothing;

-- Vérification : chaque compte et son statut de gérant
select u.email, u.email_confirmed_at is not null as confirme, a.user_id is not null as gerant
from auth.users u
left join public.app_admins a on a.user_id = u.id
order by u.created_at;
