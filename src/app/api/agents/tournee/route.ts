import { runDailyAgent } from "@/lib/agents/orchestrator";

// La tournée enchaîne plusieurs appels au modèle : on lui laisse jusqu'à 5 minutes.
export const maxDuration = 300;

/**
 * Déclenchée chaque matin par le cron Vercel (vercel.json). Vercel envoie
 * « Authorization: Bearer <CRON_SECRET> » ; toute autre requête est refusée.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  const result = await runDailyAgent("cron");
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
