"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

// Les agents ne sont plus lancés depuis le site (plus d'API Claude) : ils tournent sur l'abonnement du gérant
// (tâches planifiées) et publient leurs propositions via scripts/agents/publier.mts. Ici, seulement les validations.

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
