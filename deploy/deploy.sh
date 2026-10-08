#!/usr/bin/env bash
# Met le site à jour sur le serveur : dernière version GitHub, reconstruction, redémarrage.
# À lancer en tant qu'utilisateur « refit » :  ~/app/deploy/deploy.sh
set -euo pipefail
cd /home/refit/app

if [ ! -f .env.production ]; then
  echo "Fichier .env.production absent : voir deploy/README.md, étape 6." >&2
  exit 1
fi

echo "→ Récupération de la dernière version"
git pull --ff-only origin main

echo "→ Installation des dépendances (versions figées du package-lock.json)"
npm ci --no-audit --no-fund

echo "→ Construction du site"
npm run build

echo "→ Assemblage du serveur autonome"
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
mkdir -p .next/standalone/.next/cache

echo "→ Redémarrage"
sudo /usr/bin/systemctl restart refit-surface
sleep 3
if curl -fsS -o /dev/null http://127.0.0.1:3000/; then
  echo "✔ Site en ligne"
else
  echo "✖ Le site ne répond pas : journalctl -u refit-surface -n 50" >&2
  exit 1
fi
