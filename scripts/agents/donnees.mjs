// Données en LECTURE SEULE pour les agents planifiés (tâches Claude qui tournent sur l'abonnement, sans API).
//
//   npm run -s agent:donnees -- <agent> [--photos]
//   agents : tournee | devis | pilotage | planning | marketing
//
// Chaque agent ne reçoit que ce qu'il lui faut (minimisation RGPD : ni e-mail ni téléphone des clients).
// Le script ne fait que des SELECT : aucune écriture en base n'est possible par ce chemin.
// --photos (agent devis) : télécharge les photos des demandes dans un dossier temporaire et donne leurs chemins.

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const agent = process.argv[2];
const withPhotos = process.argv.includes("--photos");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Variables Supabase absentes : lancer depuis le dossier du projet avec npm run -s agent:donnees -- <agent>");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const DAY = 86_400_000;
const isoDaysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();
const isoDaysAhead = (n) => new Date(Date.now() + n * DAY).toISOString();

async function q(promise) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

// Contact réduit : prénom, société, ville. Jamais d'e-mail ni de téléphone.
const CONTACT = "contact:contacts(kind, company, first_name, city)";
const daysSince = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY);

/** Télécharge les photos d'une demande dans un dossier temporaire (chemins ajoutés en `fichier_local`). */
async function downloadPhotos(kind, lead) {
  const dir = join(tmpdir(), "refit-agents", kind, lead.id);
  mkdirSync(dir, { recursive: true });
  for (const p of lead.photos ?? []) {
    const { data } = await db.storage.from("lead-photos").download(p.storage_path);
    if (!data) continue;
    const file = join(dir, p.storage_path.split("/").pop());
    writeFileSync(file, Buffer.from(await data.arrayBuffer()));
    p.fichier_local = file;
  }
}

const agents = {
  /**
   * Tournée de l'Agent REFIT (remplace l'ancienne tournée par API) : demandes à qualifier avec leur détail
   * et leurs photos, prospects en cours avec leurs relances, devis envoyés, relances dues.
   */
  async tournee() {
    const ACTIVE = ["nouveau", "qualifie", "rdv", "devis_envoye"];
    const leads = await q(
      db
        .from("leads")
        .select(`id, univers, status, message, surfaces, details, ai_score, ai_summary, created_at, updated_at, contact:contacts(kind, company, first_name, last_name, postal_code, city), photos:lead_photos(storage_path)`)
        .in("status", ACTIVE)
        .order("created_at")
        .limit(100),
    );
    const ids = leads.map((l) => l.id);
    const none = ["00000000-0000-0000-0000-000000000000"];
    const [runs, followups, quotes, pending] = await Promise.all([
      q(db.from("agent_runs").select("target_id").eq("agent", "qualification").in("status", ["propose", "valide", "execute"]).in("target_id", ids.length ? ids : none)),
      q(db.from("followups").select("lead_id, step, due_at, channel, status").in("lead_id", ids.length ? ids : none)),
      q(db.from("quotes").select("lead_id, number, status, sent_at, total_ht").in("lead_id", ids.length ? ids : none)),
      q(db.from("agent_runs").select("target_id, output").eq("agent", "pipeline").eq("status", "propose")),
    ]);
    const qualified = new Set(runs.map((r) => r.target_id));
    const today = new Date().toISOString().slice(0, 10);

    const a_qualifier = leads.filter((l) => l.status === "nouveau" && !qualified.has(l.id));
    if (withPhotos) for (const lead of a_qualifier) await downloadPhotos("tournee", lead);

    return {
      date: today,
      a_qualifier: a_qualifier.map((l) => ({
        lead_id: l.id, univers: l.univers, recu_il_y_a_jours: daysSince(l.created_at), client: l.contact,
        message: l.message, surfaces: l.surfaces, details: l.details, photos: l.photos,
      })),
      en_cours: leads.filter((l) => !a_qualifier.includes(l)).map((l) => ({
        lead_id: l.id, client: l.contact, univers: l.univers, statut: l.status, score: l.ai_score, resume: l.ai_summary,
        recu_il_y_a_jours: daysSince(l.created_at), derniere_modification_il_y_a_jours: daysSince(l.updated_at),
        devis: quotes.filter((d) => d.lead_id === l.id).map(({ lead_id, ...d }) => d),
        relances: followups.filter((f) => f.lead_id === l.id).map((f) => ({ etape: f.step, prevue_le: f.due_at.slice(0, 10), canal: f.channel, statut: f.status })),
        statut_deja_propose: pending.filter((p) => p.target_id === l.id).map((p) => p.output?.statut),
      })),
      relances_dues: followups.filter((f) => f.status === "a_faire" && f.due_at.slice(0, 10) <= today)
        .map((f) => ({ lead_id: f.lead_id, etape: f.step, canal: f.channel, prevue_le: f.due_at.slice(0, 10) })),
    };
  },

  /** Demandes à chiffrer : pas encore de devis, avec photos, catalogue et réglages de prix. */
  async devis() {
    const leads = await q(
      db
        .from("leads")
        .select(`id, univers, status, message, surfaces, details, budget_estimate, ai_summary, ai_score, created_at, ${CONTACT}, photos:lead_photos(id, storage_path, caption, width_mm, height_mm)`)
        .in("status", ["nouveau", "qualifie", "rdv"])
        .gte("created_at", isoDaysAgo(60))
        .order("created_at", { ascending: false }),
    );
    const quoted = new Set((await q(db.from("quotes").select("lead_id").not("lead_id", "is", null))).map((r) => r.lead_id));
    const todo = leads.filter((l) => !quoted.has(l.id));
    if (withPhotos) for (const lead of todo) await downloadPhotos("devis", lead);
    return {
      demandes_sans_devis: todo,
      catalogue: await q(db.from("products").select("id, brand, reference, name, category, univers, finish, roll_width_mm, sale_price_m2, purchase_price_m2, waste_rate").eq("active", true)),
      reglages: await q(db.from("settings").select("day_rate, material_margin, default_waste_rate, travel_fee, vat_rate, deposit_rate").limit(1).maybeSingle()),
      regle_de_prix:
        "Prix matière HT/m² = sale_price_m2 s'il existe, sinon purchase_price_m2 × (1 + waste_rate) × (1 + material_margin). Quantité achetée = surface × (1 + waste_rate). Main d'œuvre = jours × day_rate. Déplacement = travel_fee.",
    };
  },

  /** Chiffres de pilotage : 12 derniers mois de factures, devis, demandes, chantiers. */
  async pilotage() {
    const since = isoDaysAgo(365);
    return {
      factures: await q(db.from("invoices").select("number, kind, status, issued_at, due_at, total_ht, total_ttc, amount_paid, paid_at").gte("created_at", since)),
      devis: await q(db.from("quotes").select("number, univers, status, issued_at, sent_at, signed_at, valid_until, total_ht, total_cost_ht, labour_days").gte("created_at", since)),
      demandes: await q(db.from("leads").select("univers, status, source, ai_score, created_at").gte("created_at", since)),
      chantiers: await q(db.from("jobs").select("univers, status, start_date, end_date, labour_days, started_at, finished_at").gte("created_at", since)),
      relances_en_attente: await q(db.from("followups").select("step, channel, due_at, status").eq("status", "a_faire")),
      genere_le: new Date().toISOString(),
    };
  },

  /** Planning des 3 prochaines semaines : chantiers, matière à commander, rendez-vous. */
  async planning() {
    const jobs = await q(
      db
        .from("jobs")
        .select(`id, title, univers, status, address, start_date, end_date, labour_days, materials_ordered_at, notes, ${CONTACT}, materiaux:job_materials(description, quantity_m2, status, ordered_at, received_at)`)
        .neq("status", "termine")
        .order("start_date", { ascending: true, nullsFirst: false }),
    );
    return {
      chantiers_en_cours_ou_a_venir: jobs,
      rendez_vous_14_jours: await q(
        db.from("events").select("kind, title, starts_at, ends_at, location, booked_online, notes").gte("starts_at", new Date().toISOString()).lte("starts_at", isoDaysAhead(14)).order("starts_at"),
      ),
      aujourd_hui: new Date().toISOString(),
    };
  },

  /** Matière pour le marketing : réalisations publiées et chantiers terminés (sans données personnelles). */
  async marketing() {
    return {
      realisations_publiees: await q(db.from("gallery_projects").select("title, univers, city, description, published_at").eq("published", true).order("published_at", { ascending: false })),
      chantiers_termines_90_jours: await q(db.from("jobs").select("title, univers, finished_at, labour_days").eq("status", "termine").gte("finished_at", isoDaysAgo(90))),
      demandes_par_univers_90_jours: (await q(db.from("leads").select("univers").gte("created_at", isoDaysAgo(90)))).reduce((acc, l) => ({ ...acc, [l.univers ?? "?"]: (acc[l.univers ?? "?"] ?? 0) + 1 }), {}),
    };
  },
};

if (!agents[agent]) {
  console.error(`Agent inconnu « ${agent ?? ""} ». Choix : ${Object.keys(agents).join(", ")}`);
  process.exit(1);
}
console.log(JSON.stringify(await agents[agent](), null, 2));
