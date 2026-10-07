import "server-only";
import { env } from "@/lib/env";

/** Délai maximum d'un appel à une API externe. */
export const TIMEOUT_MS = 8000;

/**
 * Identification exigée par MET Norway et Nominatim : nom de l'application et un moyen de contact.
 * LIVE_DATA_CONTACT = adresse e-mail ou site du gérant (facultatif).
 */
export function userAgent() {
  const contact = env("LIVE_DATA_CONTACT") ?? "https://refit-surface.vercel.app";
  return `REFIT-Surface/1.0 (${contact})`;
}

export class SourceError extends Error {
  constructor(
    public source: string,
    message: string,
  ) {
    super(`${source} : ${message}`);
  }
}

/** GET JSON avec délai maximum, identification et erreurs lisibles. */
export async function getJson<T>(source: string, url: string, headers: Record<string, string> = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": userAgent(), Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? `pas de réponse en ${TIMEOUT_MS / 1000} s` : "injoignable";
    throw new SourceError(source, reason);
  }
  if (!response.ok) throw new SourceError(source, `réponse HTTP ${response.status}`);
  try {
    return (await response.json()) as T;
  } catch {
    throw new SourceError(source, "réponse illisible");
  }
}
