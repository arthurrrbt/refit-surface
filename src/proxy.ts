import { NextResponse, type NextRequest } from "next/server";
import { maintenanceResponse } from "@/lib/maintenance/page";
import { maintenanceEnabled, staysOpenDuringMaintenance } from "@/lib/maintenance/mode";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Première barrière du back-office ; la vérification qui fait foi reste requireUser() (src/lib/auth.ts).
  if (/^\/app(\/|$)/.test(pathname)) {
    const { response, isAuthenticated } = await updateSession(request);
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/connexion", request.url));
    }
    return response;
  }

  // Mode maintenance (MAINTENANCE_MODE=on) : le site public affiche la page de maintenance (503)
  if (maintenanceEnabled() && !staysOpenDuringMaintenance(pathname)) {
    return maintenanceResponse();
  }
  return NextResponse.next();
}

export const config = {
  // Toutes les pages, sauf les fichiers techniques et statiques
  matcher: ["/((?!_next/|favicon|icons/|brand/|3d/|robots.txt|sitemap.xml|manifest|llms.txt).*)"],
};
