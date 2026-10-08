// Sonde la vraie base Supabase en visiteur anonyme (clé publique, celle que reçoit tout navigateur).
// Non destructif : uniquement des lectures et des écritures vouées à l'échec.
import assert from "node:assert/strict";
import { test } from "node:test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const skip = !url || !key ? "variables Supabase absentes (lancer avec --env-file=.env.local)" : false;
const h = { apikey: key ?? "", Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const privateTables = [
  "contacts", "leads", "products", "jobs", "lead_photos", "quotes", "quote_lines", "invoices", "invoice_lines",
  "events", "followups", "agent_runs", "app_admins", "settings", "document_counters", "invoice_payments",
  "job_materials", "api_cache", "rate_limits",
];

test("Anonyme : aucune ligne lisible dans les tables privées", { skip }, async () => {
  for (const t of privateTables) {
    const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers: h });
    const body = await r.json();
    assert.ok(r.status !== 200 || (Array.isArray(body) && body.length === 0), `${t} : ${r.status} ${JSON.stringify(body).slice(0, 80)}`);
  }
});

test("Anonyme : écriture refusée", { skip }, async () => {
  const r = await fetch(`${url}/rest/v1/contacts`, { method: "POST", headers: { ...h, Prefer: "return=minimal" }, body: JSON.stringify({ first_name: "AUDIT" }) });
  assert.ok(r.status === 401 || r.status === 403, `statut ${r.status}`);
});

test("Anonyme : fonctions sensibles refusées (numérotation, émission, compteur)", { skip }, async () => {
  for (const [fn, body] of [
    ["emit_invoice", { p_invoice: "00000000-0000-0000-0000-000000000000" }],
    ["next_document_number", { p_kind: "facture" }],
    ["rate_limit_hit", { p_key: "audit", p_max: 1, p_window_seconds: 1 }],
  ] as const) {
    const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers: h, body: JSON.stringify(body) });
    assert.ok(r.status >= 400, `${fn} accessible (${r.status})`);
  }
});

test("Anonyme : galerie publique sans brouillon ni identifiant interne", { skip }, async () => {
  const drafts = await fetch(`${url}/rest/v1/gallery_projects?select=id&published=eq.false`, { headers: h }).then((r) => r.json());
  assert.deepEqual(drafts, []);
  const internal = await fetch(`${url}/rest/v1/gallery_projects?select=job_id&limit=1`, { headers: h });
  assert.ok(internal.status >= 400, "job_id ne doit pas être lisible");
});

test("Anonyme : envoi de fichier et inscription refusés", { skip }, async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  for (const bucket of ["lead-photos", "documents", "gallery"]) {
    const r = await fetch(`${url}/storage/v1/object/${bucket}/audit-anon-${Date.now()}.png`, {
      method: "POST",
      headers: { apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "image/png" },
      body: png,
    });
    assert.ok(r.status >= 400, `${bucket} : envoi accepté`);
  }
  const signup = await fetch(`${url}/auth/v1/signup`, { method: "POST", headers: h, body: JSON.stringify({ email: "audit@example.invalid", password: "Audit-Only-123!" }) });
  assert.ok(signup.status >= 400, "inscription ouverte");
});
