import { NextResponse, type NextRequest } from "next/server";
import { suggestPlaces } from "@/lib/live/geo";
import { isRateLimited } from "@/lib/security/rate-limit";

/** Suggestions d'adresses pour les formulaires : le navigateur interroge ce serveur, jamais l'API directement. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.replace(/\s+/g, " ").trim() ?? "";
  const type = request.nextUrl.searchParams.get("type") === "commune" ? "commune" : "adresse";
  if (q.length < 3 || q.length > 200) return NextResponse.json({ results: [] });
  if (await isRateLimited("adresses")) return NextResponse.json({ results: [] }, { status: 429 });

  try {
    const results = await suggestPlaces(q, type);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  } catch (error) {
    console.warn("Suggestions d'adresses indisponibles", error instanceof Error ? error.message : error);
    return NextResponse.json({ results: [], unavailable: true });
  }
}
