# REFIT Surface — site et espace gérant

Site public (Saint-Malo, univers Home / Glass / Pro / Boat) et espace gérant (prospects, devis, factures,
chantiers, planning). Next.js 16 · TypeScript · Supabase · e-mails Resend.

---

## 🔧 Mode maintenance — activer / désactiver

La page de maintenance affiche le logo REFIT animé, le message « Site en cours de maintenance » et
l'adresse de contact. **Aperçu sans rien activer : `/maintenance`** (ex. https://www.refitsurface.fr/maintenance).

Pendant la maintenance, le **site public** affiche cette page ; l'**espace gérant** (`/app`), la connexion et
l'API restent accessibles pour continuer à travailler.

### A. Sur le serveur IONOS (VPS) — le plus simple, effet immédiat

Connecté au serveur (`ssh refit@ADRESSE_IP`) :

| Action | Commande |
|---|---|
| **Activer** | `touch ~/maintenance.on` |
| **Désactiver** | `rm ~/maintenance.on` |
| Vérifier l'état | `ls ~/maintenance.on` (présent = maintenance active) |

Aucun redémarrage, aucune reconstruction : Caddy vérifie la présence du fichier à chaque visite.

### B. Par les réglages du site (Vercel, ou VPS sans accès à Caddy)

Variable d'environnement `MAINTENANCE_MODE` :

| Action | Réglage |
|---|---|
| **Activer** | `MAINTENANCE_MODE=on` |
| **Désactiver** | `MAINTENANCE_MODE=off` |

- **Vercel** : Settings → Environment Variables → modifier `MAINTENANCE_MODE`, puis **Redeploy**.
- **VPS** : modifier `/home/refit/app/.env.production`, puis `sudo systemctl restart refit-surface`.

### C. Automatique en cas de panne

Sur le VPS, **Caddy affiche la page de maintenance tout seul** quand le site ne répond plus : site planté,
arrêté, en cours de redémarrage ou de mise à jour. Rien à faire : dès que le site répond de nouveau, les
visiteurs le retrouvent.

> ⚠️ **Si tout le serveur IONOS est hors service** (panne de la machine ou du réseau IONOS), aucune page ne
> peut venir de ce serveur, pas même celle-ci. Pour couvrir ce cas, il faut un relais extérieur à IONOS
> (par exemple Cloudflare devant le site, qui affiche la page quand IONOS ne répond plus). Non mis en place
> à ce jour — voir « À prévoir » plus bas.

### Modifier le texte ou l'adresse de contact

- Texte et mise en page : `src/lib/maintenance/page.ts`
- Adresse de contact : reprise automatiquement de `src/content/site.ts` (champ `email`)
- Après modification, sur le VPS : `~/app/deploy/deploy.sh` (régénère `public/maintenance.html`, servi par Caddy)

---

## Commandes utiles

```bash
npm run dev            # site en local sur http://localhost:3000
npm run build          # construction de production
npm run lint           # vérification du code
npm run test:security  # tests de sécurité (base anonyme, en-têtes, accès)
npm run test:api       # tests des API externes (météo, adresses, trajets)
npm run maintenance:html  # régénère public/maintenance.html
```

## Où trouver quoi

| Sujet | Emplacement |
|---|---|
| Coordonnées (téléphone, e-mail, ville) | `src/content/site.ts` |
| Identité légale (SIRET, médiateur, hébergeur) | `src/content/company.ts` |
| Mise en ligne sur le VPS IONOS | `deploy/README.md` |
| Migrations de la base (à appliquer dans Supabase) | `supabase/migrations/` |
| Réglages et clés (jamais dans Git) | `.env.local` (modèle : `.env.example`) |

## À prévoir

- Relais extérieur (ex. Cloudflare) pour afficher la page de maintenance si tout IONOS est hors service.
- Passer `launched: true` dans `src/content/site.ts` une fois les mentions légales complètes (référencement).
