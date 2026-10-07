import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Première barrière du back-office ; la vérification qui fait foi reste requireUser() (src/lib/auth.ts).
export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request);
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
