// Sonde HTTP du site (par défaut le serveur local ; SECURITY_BASE_URL=https://… pour la production).
// Vérifie en-têtes, accès non authentifiés et jetons invalides. Non destructif.
import assert from "node:assert/strict";
import { test } from "node:test";

const base = process.env.SECURITY_BASE_URL ?? "http://localhost:3000";
const ready = fetch(base, { redirect: "manual" }).then(() => true, () => false);
// Ignore le test (au lieu d'échouer) si le serveur n'est pas lancé
async function needServer(t: { skip: (msg: string) => void }) {
  if (await ready) return true;
  t.skip(`serveur injoignable (${base})`);
  return false;
}
const get = (path: string, init: RequestInit = {}) => fetch(base + path, { redirect: "manual", ...init });

test("En-têtes de sécurité sur les pages", async (t) => {
  if (!(await needServer(t))) return;
  for (const path of ["/", "/devis", "/connexion", "/signature/" + "0".repeat(48)]) {
    const r = await get(path);
    const csp = r.headers.get("content-security-policy") ?? "";
    assert.match(csp, /frame-ancestors 'none'/, `${path} : CSP`);
    assert.match(csp, /object-src 'none'/, `${path} : CSP`);
    assert.equal(r.headers.get("x-frame-options"), "DENY", path);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff", path);
    assert.ok(r.headers.get("referrer-policy"), path);
    assert.equal(r.headers.get("x-powered-by"), null, `${path} : X-Powered-By`);
  }
});

test("Back-office : pages et PDF inaccessibles sans connexion", async (t) => {
  if (!(await needServer(t))) return;
  for (const path of ["/app", "/app/prospects", "/app/factures", "/app/devis/00000000-0000-0000-0000-000000000000/pdf"]) {
    const r = await get(path);
    assert.ok([302, 303, 307, 308].includes(r.status), `${path} : ${r.status}`);
    assert.match(r.headers.get("location") ?? "", /\/connexion/, path);
  }
});

test("Cron de l'agent : refusé sans le bon secret", async (t) => {
  if (!(await needServer(t))) return;
  assert.equal((await get("/api/agents/tournee")).status, 401);
  assert.equal((await get("/api/agents/tournee", { headers: { Authorization: "Bearer devine" } })).status, 401);
});

test("Flux du planning : refusé avec un jeton faux ou absent", async (t) => {
  if (!(await needServer(t))) return;
  assert.equal((await get("/api/planning/ics")).status, 401);
  assert.equal((await get("/api/planning/ics?token=" + "a".repeat(48))).status, 401);
});

test("Liens clients : jeton inconnu ou malformé → 404 sans détail", async (t) => {
  if (!(await needServer(t))) return;
  for (const path of ["/facture/" + "0".repeat(48), "/facture/..%2F..%2Fetc%2Fpasswd", "/signature/" + "0".repeat(48) + "/pdf"]) {
    const r = await get(path);
    assert.equal(r.status, 404, path);
    const text = await r.text();
    assert.ok(!/at .*\(|node_modules|supabase\.co|stack/i.test(text), `${path} : détails internes`);
  }
});

test("Suggestions d'adresses : entrée invalide ignorée, pas d'erreur", async (t) => {
  if (!(await needServer(t))) return;
  const long = await get("/api/adresses?q=" + "a".repeat(500));
  assert.deepEqual(await long.json(), { results: [] });
  const inj = await get("/api/adresses?q=" + encodeURIComponent("<script>alert(1)</script>' OR 1=1--"));
  assert.ok(inj.status === 200 || inj.status === 429);
});
