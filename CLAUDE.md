@AGENTS.md

# REFIT Surface

Site public + back-office PWA avec agents IA pour REFIT Surface (Saint-Malo), poseur certifié Cover Styl' et films solaires Solar Screen. Univers : Home (cuisine, mobilier), Glass (films solaires, intimité, sécurité), Pro (hôtels, restaurants), Boat (intérieurs de bateaux).

- Feuille de route et modèle de données : `docs/ROADMAP.md`
- Langue du site et de l'interface : français uniquement
- Un seul utilisateur du back-office (le gérant), usage mobile sur chantier essentiel
- Charte : fond noir, blanc, accent bleu `#1EA7E1` env., matières (bois, marbre noir, béton, verre) — voir `public/brand/`
- Les agents IA proposent, l'humain valide avant tout envoi externe
- Données hébergées dans l'UE (Supabase UE, Vercel `cdg1`)
- Secrets dans `.env.local` (jamais commité) ; modèle dans `.env.example`

## Conventions techniques

- Next.js 16 : `src/proxy.ts` (ex-middleware), `cacheComponents` activé → toute lecture de session/cookies doit être sous `<Suspense>` (voir `AuthGate` dans `src/app/app/layout.tsx`)
- Auth : `requireUser()` (`src/lib/auth.ts`) dans chaque page, Server Action et Route Handler du back-office ; le proxy n'est qu'une première barrière
- Base de données : migrations SQL dans `supabase/migrations/`, RLS partout via `public.is_admin()` (table `app_admins`)
- Charte : tokens Tailwind dans `src/app/globals.css` (`ink`, `paper`, `accent`, `font-display`…) ; logo SVG dans `src/components/brand/Logo.tsx`
- Contenus éditables : `src/content/site.ts` (coordonnées) et `src/content/univers.ts` (textes des 4 univers)
- `ButtonLink`/`Button` posent déjà un `display` : pour masquer selon l'écran, envelopper dans un `<div className="hidden sm:block">`
