import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Live } from "./types";

type Source<T> = { name: string; fetch: () => Promise<T> };
type Row<T> = { value: T; source: string; fetched_at: string };

/**
 * Donnée externe avec cache et repli, stockée dans la table api_cache :
 * 1. valeur en cache encore fraîche → renvoyée sans appel ;
 * 2. sinon, les sources sont essayées dans l'ordre (principale puis secours) ;
 * 3. si toutes échouent → dernière valeur connue (stale = true), ou null s'il n'y en a jamais eu.
 * Une panne de la base ne bloque pas : on appelle alors directement les sources.
 */
export async function withCache<T>(key: string, maxAgeMs: number, sources: Source<T>[]): Promise<Live<T> | null> {
  const db = createAdminClient();
  let cached: Row<T> | null = null;
  try {
    const { data } = await db.from("api_cache").select("value, source, fetched_at").eq("key", key).maybeSingle();
    cached = data as Row<T> | null;
  } catch {
    // cache indisponible : on continue sans
  }
  if (cached && Date.now() - Date.parse(cached.fetched_at) < maxAgeMs) {
    return { data: cached.value, source: cached.source, fetchedAt: cached.fetched_at, stale: false };
  }

  for (const source of sources) {
    try {
      const data = await source.fetch();
      const fetchedAt = new Date().toISOString();
      const { error } = await db.from("api_cache").upsert({ key, value: data, source: source.name, fetched_at: fetchedAt });
      if (error) console.warn(`api_cache ${key} : ${error.message}`);
      return { data, source: source.name, fetchedAt, stale: false };
    } catch (error) {
      console.warn(`Donnée ${key} : ${error instanceof Error ? error.message : error}`);
    }
  }

  return cached ? { data: cached.value, source: cached.source, fetchedAt: cached.fetched_at, stale: true } : null;
}
