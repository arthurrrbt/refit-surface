"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { runDailyAgent } from "@/lib/agents/orchestrator";
import { runQualification } from "@/lib/agents/qualification";
import { requireUser } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

export type AgentActionState = { message?: string; error?: string };

/** Lance la tournée de l'Agent REFIT tout de suite (même traitement que le cron du matin). */
export async function lancerTournee(): Promise<AgentActionState> {
  await requireUser();
  const result = await runDailyAgent("manuel");
  refresh();
  if (!result.ok) return { error: result.error };
  return {
    message: result.actions.length
      ? `Tournée terminée : ${result.actions.length} action(s) préparée(s).`
      : "Tournée terminée : rien à préparer aujourd'hui.",
  };
}

/** Relance l'analyse IA d'une demande. */
export async function requalifier(_prev: AgentActionState, formData: FormData): Promise<AgentActionState> {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("lead_id"));
  if (!id.success) return { error: "Prospect invalide." };
  const result = await runQualification(id.data);
  refresh();
  return result.ok ? { message: "Analyse terminée." } : { error: result.error };
}

/** Valide ou rejette une proposition d'agent ; un changement de statut validé est appliqué au prospect. */
export async function deciderProposition(formData: FormData) {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), decision: z.enum(["valide", "rejete"]) })
    .safeParse({ id: formData.get("id"), decision: formData.get("decision") });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: run } = await supabase
    .from("agent_runs")
    .select("id, agent, status, output, target_id")
    .eq("id", parsed.data.id)
    .single();
  if (!run || run.status !== "propose") return;

  if (parsed.data.decision === "valide" && run.agent === "pipeline" && run.target_id) {
    const statut = z.enum(LEAD_STATUSES).safeParse((run.output as { statut?: string } | null)?.statut);
    if (statut.success) {
      const { error } = await supabase.from("leads").update({ status: statut.data }).eq("id", run.target_id);
      if (error) throw error;
    }
  }

  await supabase
    .from("agent_runs")
    .update({ status: parsed.data.decision, validated_at: new Date().toISOString() })
    .eq("id", run.id);
  refresh();
}

/** Marque une relance comme faite ou l'annule. */
export async function majRelance(formData: FormData) {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), statut: z.enum(["envoye", "annule"]) })
    .safeParse({ id: formData.get("id"), statut: formData.get("statut") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("followups")
    .update({ status: parsed.data.statut, sent_at: parsed.data.statut === "envoye" ? new Date().toISOString() : null })
    .eq("id", parsed.data.id);
  refresh();
}
