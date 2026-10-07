# REFIT Surface — Feuille de route

Stack : Next.js 16 (App Router, TypeScript, Tailwind 4) · Supabase (Postgres, Auth, Storage, pg_cron — région UE) · API Claude (agents) · Vercel (région `cdg1`) · Microsoft Graph (Outlook) · Brevo/Resend (e-mails) · Plateforme agréée (factures électroniques).

## Architecture

```
src/app/
  (site)/            → site public : accueil, /home, /glass, /pro, /boat,
                       /realisations, /devis, /rendez-vous, /contact
  app/               → back-office PWA (protégé, un seul compte admin)
    prospects/  devis/  factures/  planning/  chantiers/  pilotage/  agents/
  api/               → webhooks, crons, endpoints agents
src/lib/
  supabase/          → clients serveur / navigateur
  agents/            → définitions des agents Claude + outils (tool use)
  pricing/           → moteur de chiffrage (prix TEGO, pertes, objectif €/jour)
supabase/migrations/ → schéma SQL versionné
```

## Modèle de données (première version)

| Table | Rôle |
|---|---|
| `contacts` | Particuliers et pros (hôtels, restaurants, architectes, chantiers navals) |
| `leads` | Demandes entrantes : univers (home/glass/pro/boat), statut du pipeline, source |
| `lead_photos` | Photos et dimensions envoyées par le client ou prises sur chantier |
| `products` | Références Cover Styl' / films Solar Screen, prix d'achat TEGO, laize |
| `quotes` / `quote_lines` | Devis versionnés, signature, statut |
| `invoices` / `invoice_lines` | Factures (numérotation continue, transmission via la plateforme agréée) |
| `jobs` | Chantiers : dates de pose, matériel, commandes |
| `events` | Planning : visites, métrages, poses (synchronisé avec Outlook) |
| `followups` | Relances planifiées (J+3 / J+7 / J+15) |
| `agent_runs` | Journal des actions des agents + validations humaines |
| `gallery_projects` | Réalisations avant/après publiées sur le site |

Règle d'or : **les agents proposent, l'humain valide** avant tout envoi externe (e-mail, devis, publication).

## Phases

### Phase 1 — Fondations (semaines 1–2)
- [x] Identité visuelle : tokens couleurs/typo, logo SVG, icônes PWA, composants de base
- [x] Schéma initial (`supabase/migrations`) + auth Supabase (compte admin unique)
- [x] Appliquer la migration sur le projet Supabase + créer le compte gérant
- [ ] Déploiement Vercel + domaine `refitsurface.fr`
- [x] Squelette site public + back-office protégé (PWA)

### Phase 2 — Site public (semaines 2–4)
- [ ] Accueil + 4 pages univers (Home, Glass, Pro, Boat), SEO local Saint-Malo
- [x] Galerie avant/après filtrable (curseur comparatif), gérée depuis le back-office
- [x] Formulaire de devis intelligent (univers, surfaces, dimensions, photos) → prospect dans le back-office
- [x] Prise de RDV en ligne (créneaux selon disponibilités et planning) + planning back-office + flux .ics pour Outlook
- [ ] Mentions légales, RGPD, données structurées (LocalBusiness)

### Phase 3 — Back-office cœur (semaines 4–7)
- [ ] CRM : fiches contacts, pipeline des demandes
- [x] Catalogue produits (prix TEGO) + moteur de chiffrage matière + main d'œuvre, marge et €/jour
- [x] Devis PDF (mentions légales, numérotation continue) + signature électronique maison avec certificat de preuve
- [x] Factures (acompte / solde / globale), numérotation continue, immuabilité en base, encaissements, relances
- [x] Avoirs (total / partiel), numérotation A-AAAA-0001, imputation et remboursement
- [ ] Transmission via une plateforme agréée (facture électronique, TPE : 01/09/2027)
- [x] Suivi des chantiers : création à la signature, matière à commander (TEGO), planification de la pose, photos avant/pendant/après, publication galerie

### Phase 4 — Agents IA (semaines 6–10)
1. [x] Qualification client (texte + photos → note, faisabilité, questions, brouillon de réponse) — automatique à chaque demande
2. [ ] Devis (photos + dimensions + produit → pré-chiffrage)
3. [x] Agent REFIT autonome (cron quotidien) : qualifie les retards, programme les relances J+3/J+7/J+15 avec brouillons, propose les statuts, publie le point du jour
4. [ ] Pilotage (synthèse hebdo : CA, marge matière, jours de pose, devis en attente, conversion)
5. [ ] Planning chantier (visites, commandes, rappels clients)
6. [ ] Marketing (posts avant/après, études de cas)
7. [ ] Prospection B2B (hôtels, restaurants, architectes, nautisme) — opt-out obligatoire

## Points de vigilance
- **Facture électronique** : réception obligatoire depuis le 01/09/2026, émission TPE au 01/09/2027 → transmission via une plateforme agréée, pas de développement maison du flux.
- **Prospection** : B2B par e-mail autorisée avec désinscription ; B2C uniquement avec consentement ; téléphone → Bloctel.
- **RGPD** : hébergement UE, registre des traitements, durée de conservation des prospects (3 ans).
