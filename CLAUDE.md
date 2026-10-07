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
