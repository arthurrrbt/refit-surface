import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** Limites par adresse IP, appliquées côté serveur (table rate_limits, incrément atomique). */
export const LIMITS = {
  connexion: { max: 10, windowSeconds: 15 * 60 },
  devis: { max: 5, windowSeconds: 60 * 60 },
  devisPhotos: { max: 10, windowSeconds: 60 * 60 },
  rendezVous: { max: 5, windowSeconds: 60 * 60 },
  signature: { max: 10, windowSeconds: 60 * 60 },
  adresses: { max: 120, windowSeconds: 60 },
} as const;

export type LimitedAction = keyof typeof LIMITS;

/**
 * IP réelle du visiteur, lue dans l'en-tête posé par le serveur frontal de confiance :
 * - CLIENT_IP_HEADER=x-real-ip sur le VPS (Caddy l'écrase avec l'adresse de la connexion, le client ne peut pas le choisir) ;
 * - par défaut x-forwarded-for (première valeur), réécrit par Vercel.
 * Ne jamais lire un en-tête que le frontal ne réécrit pas : il serait falsifiable.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const header = (env("CLIENT_IP_HEADER") ?? "x-forwarded-for").toLowerCase();
  return h.get(header)?.split(",")[0]?.trim() || "inconnue";
}

/** IPv6 : on limite par bloc /64 (un abonné en dispose d'un entier et peut changer d'adresse à volonté). */
export function ipBucket(ip: string): string {
  if (!ip.includes(":") || ip.includes(".")) return ip; // IPv4 (ou IPv4 encapsulée)
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right];
  return groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

/** Empreinte non réversible de l'IP : la table ne contient jamais d'adresse en clair. */
function fingerprint(ip: string) {
  return createHmac("sha256", env("SUPABASE_SECRET_KEY") ?? "refit-rate-limit").update(ipBucket(ip)).digest("hex").slice(0, 32);
}

/**
 * true si l'action dépasse sa limite pour ce visiteur. En cas de panne du compteur, on laisse passer
 * (le site reste utilisable) et on le signale dans les journaux.
 */
export async function isRateLimited(action: LimitedAction, ip?: string): Promise<boolean> {
  const { max, windowSeconds } = LIMITS[action];
  const key = `${action}:${fingerprint(ip ?? (await clientIp()))}`;
  const { data, error } = await createAdminClient().rpc("rate_limit_hit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) {
    console.warn(`Limitation de débit indisponible (${action}) : ${error.message}`);
    return false;
  }
  return data === false;
}

export const TOO_MANY = "Trop de tentatives depuis votre connexion. Réessayez un peu plus tard ou appelez-nous.";
