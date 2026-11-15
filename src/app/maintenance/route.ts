import { maintenanceResponse } from "@/lib/maintenance/page";

/** Aperçu de la page de maintenance, telle que les visiteurs la verront (sans activer la maintenance). */
export function GET() {
  return maintenanceResponse(200);
}
