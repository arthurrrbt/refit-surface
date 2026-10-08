import { createHash, timingSafeEqual } from "node:crypto";
import { runDailyAgent } from "@/lib/agents/orchestrator";
import { env } from "@/lib/env";

// La tournée enchaîne plusieurs appels au modèle : on lui laisse jusqu'à 5 minutes.
export const maxDuration = 300;

/**
 * Déclenchée chaque matin par le cron Vercel (vercel.json). Vercel envoie
 * « Authorization: Bearer <CRON_SECRET> » ; toute autre requête est refusée.
 */
export async function GET(request: Request) {
  const secret = env("CRON_SECRET");
  // Comparaison en temps constant (empreintes de même longueur) : pas de fuite du secret par la durée de réponse
  const digest = (v: string) => createHash("sha256").update(v).digest();
  const given = request.headers.get("authorization") ?? "";
  if (!secret || !timingSafeEqual(digest(given), digest(`Bearer ${secret}`))) {
    return new Response("Non autorisé", { status: 401 });
  }
  const result = await runDailyAgent("cron");
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
