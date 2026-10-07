import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

export const AGENT_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;

/** Client Claude partagé (clé : ANTHROPIC_API_KEY). Null si la clé n'est pas configurée. */
export function getAnthropic(): Anthropic | null {
  const apiKey = env("ANTHROPIC_API_KEY");
  if (!apiKey) return null;
  client ??= new Anthropic({ apiKey });
  return client;
}

/** Message lisible d'une erreur de l'API Claude (ex. crédit insuffisant, clé invalide). */
export function describeApiError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return "Clé API Claude invalide.";
  if (error instanceof Anthropic.RateLimitError) return "Limite d'utilisation de l'API Claude atteinte, réessayez plus tard.";
  if (error instanceof Anthropic.APIError) {
    const detail = (error.error as { error?: { message?: string } } | undefined)?.error?.message;
    if (error.status === 400 && detail?.toLowerCase().includes("credit")) {
      return "Crédit API Claude épuisé : rechargez le compte sur console.anthropic.com (Plans & Billing).";
    }
    return `Erreur de l'API Claude (${error.status ?? "réseau"})${detail ? ` : ${detail}` : ""}.`;
  }
  return error instanceof Error ? error.message : "Erreur inattendue.";
}
