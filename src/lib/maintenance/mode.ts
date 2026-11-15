import { env } from "@/lib/env";

/** Interrupteur de maintenance du site : MAINTENANCE_MODE=on (voir README, « Mode maintenance »). */
export function maintenanceEnabled() {
  return ["on", "1", "true", "oui"].includes((env("MAINTENANCE_MODE") ?? "").toLowerCase());
}

// Toujours accessibles pendant la maintenance : espace gérant, connexion, API (application mobile, agents,
// planning Outlook) et l'aperçu de la page elle-même.
const ALWAYS_OPEN = [/^\/app(\/|$)/, /^\/connexion(\/|$)/, /^\/api\//, /^\/maintenance$/];

export function staysOpenDuringMaintenance(pathname: string) {
  return ALWAYS_OPEN.some((pattern) => pattern.test(pathname));
}
