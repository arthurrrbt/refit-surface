// SEUL chemin d'écriture des agents planifiés vers l'espace gérant (page « Agents IA », fiches prospects).
// Les agents tournent sur l'abonnement Claude (tâches planifiées), sans API : ce script enregistre leurs
// propositions dans les mêmes tables que l'ancien agent par API, avec les mêmes vérifications.
// Rien n'est envoyé au client ni appliqué : tout reste « à valider » par le gérant.
//
//   npm run -s agent:publier -- qualification <lead_id> <fichier.json>   analyse d'une demande
//   npm run -s agent:publier -- relance       <lead_id> <fichier.json>   relance à faire, avec brouillon
//   npm run -s agent:publier -- statut        <lead_id> <fichier.json>   proposition de changement de statut
//   npm run -s agent:publier -- point-du-jour <fichier.json>             point du jour (tableau de bord)
//   npm run -s agent:publier -- tournee       <fichier.json>             compte rendu de la tournée
//   npm run -s agent:publier -- rapport <agent> <fichier.md>             rapport d'un agent (planning, devis…)
//
// Les données passent par un fichier (pas par la ligne de commande) : aucun problème de guillemets.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { qualificationSchema } from "../../src/lib/agents/qualification-schema";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Variables Supabase absentes : lancer avec npm run -s agent:publier -- …");
const db = createClient(url, key, { auth: { persistSession: false } });

const [command, ...args] = process.argv.slice(2);
const uuid = z.uuid();
const readJson = (path: string | undefined) => {
  if (!path) throw new Error("Chemin du fichier JSON manquant.");
  return JSON.parse(readFileSync(path, "utf8"));
};

async function existingLead(id: string | undefined) {
  const leadId = uuid.parse(id);
  const { data } = await db.from("leads").select("id, surfaces").eq("id", leadId).maybeSingle();
  if (!data) throw new Error(`Demande ${leadId} introuvable.`);
  return data as { id: string; surfaces: { largeur_mm?: number; hauteur_mm?: number; quantite?: number }[] };
}

const AGENT_NAMES = ["planning", "devis", "pilotage", "marketing", "medias", "tournee"] as const;

// Une sortie naturelle (sans process.exit) : sous Windows, couper net le processus pendant la fermeture
// des connexions réseau provoque une erreur trompeuse alors que l'écriture a réussi.
async function run(): Promise<string> {
switch (command) {
  case "qualification": {
    const lead = await existingLead(args[0]);
    const result = qualificationSchema.parse(readJson(args[1]));
    const score = Math.max(0, Math.min(100, Math.round(result.score)));
    const surface_m2 =
      Math.round(
        (lead.surfaces ?? []).reduce((sum, s) => (s.largeur_mm && s.hauteur_mm ? sum + (s.largeur_mm * s.hauteur_mm * (s.quantite ?? 1)) / 1e6 : sum), 0) * 100,
      ) / 100;
    const { error } = await db.from("agent_runs").insert({
      agent: "qualification",
      status: "propose",
      input: { lead_id: lead.id, source: "abonnement" },
      output: { ...result, score, surface_m2 },
      target_table: "leads",
      target_id: lead.id,
    });
    if (error) throw error;
    await db.from("leads").update({ ai_summary: result.resume, ai_score: score }).eq("id", lead.id);
    return (`Analyse enregistrée (note ${score}).`);
  }

  case "relance": {
    const lead = await existingLead(args[0]);
    const r = z
      .object({
        etape: z.enum(["J+3", "J+7", "J+15", "autre"]),
        date_prevue: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        canal: z.enum(["email", "telephone", "sms"]),
        brouillon: z.string().min(1).max(4000),
      })
      .parse(readJson(args[1]));
    if (r.etape !== "autre") {
      const { data } = await db.from("followups").select("id").eq("lead_id", lead.id).eq("step", r.etape).neq("status", "annule").limit(1);
      if (data?.length) return (`Relance ${r.etape} déjà programmée pour cette demande : rien à faire.`);
    }
    const { error } = await db.from("followups").insert({
      lead_id: lead.id,
      step: r.etape,
      due_at: `${r.date_prevue}T07:00:00Z`,
      channel: r.canal,
      draft: r.brouillon,
    });
    if (error) throw error;
    return (`Relance ${r.etape} (${r.canal}) programmée le ${r.date_prevue}.`);
  }

  case "statut": {
    const lead = await existingLead(args[0]);
    const p = z.object({ statut: z.enum(["qualifie", "rdv", "devis_envoye", "gagne", "perdu"]), raison: z.string().min(1).max(1000) }).parse(readJson(args[1]));
    const { data: pending } = await db.from("agent_runs").select("output").eq("agent", "pipeline").eq("status", "propose").eq("target_id", lead.id);
    if (pending?.some((x) => (x.output as { statut?: string } | null)?.statut === p.statut)) return ("Proposition identique déjà en attente : rien à faire.");
    const { error } = await db.from("agent_runs").insert({
      agent: "pipeline",
      status: "propose",
      input: { lead_id: lead.id, source: "abonnement" },
      output: { type: "changement_statut", ...p },
      target_table: "leads",
      target_id: lead.id,
    });
    if (error) throw error;
    return (`Statut « ${p.statut} » proposé.`);
  }

  case "point-du-jour": {
    const b = z.object({ titre: z.string().min(1).max(300), priorites: z.array(z.string().max(500)).max(8), commentaire: z.string().max(2000) }).parse(readJson(args[0]));
    const { error } = await db.from("agent_runs").insert({ agent: "point_du_jour", status: "propose", output: b });
    if (error) throw error;
    return ("Point du jour publié.");
  }

  case "tournee": {
    const t = z.object({ conclusion: z.string().max(4000), actions: z.array(z.string().max(500)).max(50) }).parse(readJson(args[0]));
    const { error } = await db.from("agent_runs").insert({ agent: "orchestrateur", status: "execute", input: { declencheur: "abonnement" }, output: t });
    if (error) throw error;
    return ("Compte rendu de tournée enregistré.");
  }

  case "rapport": {
    const agent = z.enum(AGENT_NAMES).parse(args[0]);
    if (!args[1]) throw new Error("Chemin du rapport .md manquant.");
    const markdown = readFileSync(args[1], "utf8").slice(0, 60_000);
    const titre = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? `Rapport ${agent}`;
    const { error } = await db.from("agent_runs").insert({ agent: `rapport:${agent}`, status: "execute", output: { titre, markdown } });
    if (error) throw error;
    return (`Rapport ${agent} publié dans l'espace gérant.`);
  }

  default:
    throw new Error("Commande inconnue. Choix : qualification, relance, statut, point-du-jour, tournee, rapport");
}
}

console.log(await run());
