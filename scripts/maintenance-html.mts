// Écrit public/maintenance.html à partir de src/lib/maintenance/page.ts (une seule source pour la page).
// Ce fichier est servi par Caddy sur le VPS quand le site est en maintenance ou ne répond plus.
// Usage : npm run maintenance:html (lancé automatiquement par deploy/deploy.sh)
import { writeFileSync } from "node:fs";
import { MAINTENANCE_HTML } from "@/lib/maintenance/page";

writeFileSync("public/maintenance.html", MAINTENANCE_HTML);
console.log("✔ public/maintenance.html à jour");
