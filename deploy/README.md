# Mise en ligne sur un VPS IONOS

Le site tourne sur votre serveur, derrière **Caddy** (HTTPS automatique). La base de données et les fichiers
restent chez **Supabase**, les e-mails chez **Resend** : rien à déménager de ce côté.

```
Visiteur ──HTTPS──▶ Caddy (ports 80/443) ──▶ Site Next.js (127.0.0.1:3000, invisible d'Internet)
                                                   │
                                                   ├──▶ Supabase (base, fichiers)
                                                   └──▶ Resend, Anthropic, MET Norway, IGN
```

Les commandes précédées de `$` se tapent sur le serveur, celles marquées **PC** dans PowerShell sur votre ordinateur.
Comptez une heure pour la première installation.

---

## 1. Commander le serveur

Dans l'espace client IONOS, commandez un **VPS Linux** :

- système : **Ubuntu 24.04 LTS** ;
- au moins **2 Go de mémoire** (la construction du site en a besoin) ;
- centre de données en **France** ou, à défaut, dans l'Union européenne.

## 2. Votre clé de connexion (sur le PC)

**PC** — créez une clé SSH si vous n'en avez pas (appuyez sur Entrée aux questions, choisissez une phrase de passe) :

```
ssh-keygen -t ed25519
```

Ajoutez le contenu de `C:\Users\<vous>\.ssh\id_ed25519.pub` dans l'espace IONOS (clés SSH du serveur),
puis notez l'**adresse IP** du serveur.

**Pare-feu IONOS** (Cloud Panel → Réseau → Stratégies de pare-feu) : n'autorisez que les ports **22**, **80** et **443**.

## 3. Sécuriser le serveur

**PC** :

```
ssh root@ADRESSE_IP
```

Sur le serveur :

```
$ apt update && apt upgrade -y
$ apt install -y unattended-upgrades ufw git curl
$ dpkg-reconfigure -plow unattended-upgrades        # répondez « Oui » : mises à jour de sécurité automatiques
$ ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# Compte qui fait tourner le site (sans mot de passe, sans droits d'administration)
$ adduser --disabled-password --gecos "" refit
$ mkdir -p /home/refit/.ssh && cp /root/.ssh/authorized_keys /home/refit/.ssh/
$ chown -R refit:refit /home/refit/.ssh && chmod 700 /home/refit/.ssh

# Seul droit accordé : redémarrer le site
$ echo 'refit ALL=(root) NOPASSWD: /usr/bin/systemctl restart refit-surface' > /etc/sudoers.d/refit
$ chmod 440 /etc/sudoers.d/refit

# Connexion par clé uniquement (plus de mot de passe)
$ sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
$ systemctl restart ssh
```

> Vérifiez dans une **autre** fenêtre que `ssh root@ADRESSE_IP` fonctionne encore avant de fermer la première.

## 4. Installer Node.js 24 et Caddy

```
$ curl -fsSL https://deb.nodesource.com/setup_24.x -o nodesource_setup.sh
$ bash nodesource_setup.sh && apt install -y nodejs
$ node -v                                            # doit afficher v24.x

$ apt install -y debian-keyring debian-archive-keyring apt-transport-https
$ curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
$ curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
$ chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
$ apt update && apt install -y caddy
```

## 5. Récupérer le code (dépôt privé)

```
$ su - refit
$ ssh-keygen -t ed25519 -f ~/.ssh/github -N ""
$ cat ~/.ssh/github.pub
```

Copiez la ligne affichée dans GitHub : dépôt **refit-surface → Settings → Deploy keys → Add deploy key**
(laissez **« Allow write access » décoché** : le serveur ne peut que lire).

```
$ printf 'Host github.com\n  IdentityFile ~/.ssh/github\n  IdentitiesOnly yes\n' > ~/.ssh/config
$ git clone git@github.com:arthurrrbt/refit-surface.git ~/app
```

## 6. Les clés du site

**PC** — envoyez votre fichier de configuration sur le serveur :

```
scp C:\dev\refit-surface\.env.local refit@ADRESSE_IP:/home/refit/app/.env.production
```

Sur le serveur (toujours en tant que `refit`) :

```
$ cd ~/app
$ echo 'CLIENT_IP_HEADER=x-real-ip' >> .env.production
$ chmod 600 .env.production
```

`CLIENT_IP_HEADER` est indispensable : sans lui, la limitation de débit lirait une adresse IP falsifiable.

## 7. Construire et lancer le site

```
$ exit                                               # retour en root
$ cp /home/refit/app/deploy/refit-surface.service /home/refit/app/deploy/refit-tournee.* /etc/systemd/system/
$ systemctl daemon-reload
$ su - refit -c '~/app/deploy/deploy.sh'             # construit le site (quelques minutes)
$ systemctl enable --now refit-surface refit-tournee.timer
$ curl -I http://127.0.0.1:3000/                     # doit répondre 200
```

## 8. HTTPS et nom de domaine

```
$ cp /home/refit/app/deploy/Caddyfile /etc/caddy/Caddyfile
$ systemctl reload caddy
```

Chez IONOS (**Domaines & SSL → refitsurface.fr → DNS**) :

| Type | Nom | Valeur |
|---|---|---|
| A | `@` | ADRESSE_IP (remplace l'enregistrement de la page d'attente) |
| A | `www` | ADRESSE_IP |
| AAAA | `@` et `www` | adresse IPv6 du serveur, si IONOS en fournit une (sinon supprimez les AAAA existants) |

Ne touchez pas aux enregistrements **MX** ni à ceux de **Resend**.
Dès que le DNS pointe vers le serveur (quelques minutes à quelques heures), Caddy obtient le certificat tout seul.

## 9. Vérifications

**PC**, dans le dossier du projet :

```
$env:SECURITY_BASE_URL="https://www.refitsurface.fr"; npm run test:security
```

Puis : une demande de devis test, une connexion au back-office, un envoi de photo de chantier.
Tournée de l'agent : `systemctl list-timers refit-tournee` (prochain déclenchement à 8 h).

## 10. Quitter Vercel

Une fois tout vérifié : Vercel → projet → **Settings → Delete Project** (efface aussi les clés stockées chez Vercel).

---

## Mettre le site à jour

Après chaque modification publiée sur GitHub :

```
ssh refit@ADRESSE_IP "~/app/deploy/deploy.sh"
```

## En cas de problème

| Symptôme | Commande |
|---|---|
| Le site ne répond pas | `journalctl -u refit-surface -n 50` |
| Problème de certificat / HTTPS | `journalctl -u caddy -n 50` |
| La tournée de l'agent n'a pas eu lieu | `journalctl -u refit-tournee -n 20` |
| Redémarrer le site | `sudo systemctl restart refit-surface` |

## Entretien

- Les **mises à jour de sécurité** s'installent seules ; redémarrez le serveur une fois par mois (`reboot`).
- Les **sauvegardes** concernent Supabase (base et fichiers), pas le serveur : il se reconstruit à l'identique avec ce guide.
- Ne modifiez jamais le code directement sur le serveur : passez par GitHub, puis `deploy.sh`.
