import "server-only";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Qualification } from "./qualification-schema";

export type AgentRun<T = Record<string, unknown>> = {
  id: string;
  agent: string;
  status: "propose" | "valide" | "rejete" | "execute" | "erreur";
  output: T | null;
  error: string | null;
  target_id: string | null;
  created_at: string;
};

export type QualificationOutput = Qualification & { surface_m2?: number };
export type StatusProposal = { type: "changement_statut"; statut: string; raison: string };
export type DailyBrief = { titre: string; priorites: string[]; commentaire: string };
export type RoundOutput = { conclusion?: string; actions?: string[]; iterations?: number };

export type Followup = {
  id: string;
  lead_id: string | null;
  step: string;
  due_at: string;
  channel: "email" | "sms" | "telephone";
  draft: string | null;
  status: "a_faire" | "envoye" | "annule";
  sent_at: string | null;
};

type ContactLite = { company: string | null; first_name: string | null; last_name: string | null; email: string | null; phone: string | null };
export type FollowupWithContact = Followup & { leads: { id: string; contacts: ContactLite | null } | null };
export type ProposalWithLead = AgentRun<StatusProposal> & { lead: { id: string; status: string; contacts: ContactLite | null } | null };

const RUN_FIELDS = "id, agent, status, output, error, target_id, created_at";

/** Données IA d'un prospect : dernière analyse, propositions en attente, relances. */
export async function getLeadAgentData(leadId: string) {
  await requireUser();
  const supabase = await createClient();
  const [qualif, proposals, followups] = await Promise.all([
    supabase
      .from("agent_runs")
      .select(RUN_FIELDS)
      .eq("agent", "qualification")
      .eq("target_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("agent_runs")
      .select(RUN_FIELDS)
      .eq("agent", "pipeline")
      .eq("status", "propose")
      .eq("target_id", leadId)
      .order("created_at", { ascending: false }),
    supabase.from("followups").select("*").eq("lead_id", leadId).order("due_at"),
  ]);
  return {
    qualification: (qualif.data ?? null) as AgentRun<QualificationOutput> | null,
    proposals: (proposals.data ?? []) as AgentRun<StatusProposal>[],
    followups: (followups.data ?? []) as Followup[],
  };
}

/** Vue d'ensemble de la page Agents IA. */
export async function getAgentsOverview() {
  await requireUser();
  const supabase = await createClient();
  const [rounds, brief, proposals, followups, errors] = await Promise.all([
    supabase.from("agent_runs").select(RUN_FIELDS).eq("agent", "orchestrateur").order("created_at", { ascending: false }).limit(5),
    supabase.from("agent_runs").select(RUN_FIELDS).eq("agent", "point_du_jour").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("agent_runs").select(RUN_FIELDS).eq("agent", "pipeline").eq("status", "propose").order("created_at", { ascending: false }),
    supabase
      .from("followups")
      .select("*, leads(id, contacts(company, first_name, last_name, email, phone))")
      .eq("status", "a_faire")
      .order("due_at")
      .limit(50),
    supabase.from("agent_runs").select(RUN_FIELDS).eq("status", "erreur").order("created_at", { ascending: false }).limit(5),
  ]);

  // Rattache chaque proposition à son prospect (target_id n'est pas une clé étrangère)
  const proposalRuns = (proposals.data ?? []) as AgentRun<StatusProposal>[];
  const leadIds = [...new Set(proposalRuns.map((p) => p.target_id).filter(Boolean))] as string[];
  const { data: leads } = leadIds.length
    ? await supabase.from("leads").select("id, status, contacts(company, first_name, last_name, email, phone)").in("id", leadIds)
    : { data: [] };
  const leadMap = new Map((leads ?? []).map((l) => [l.id, l]));

  return {
    rounds: (rounds.data ?? []) as AgentRun<RoundOutput>[],
    brief: (brief.data ?? null) as AgentRun<DailyBrief> | null,
    proposals: proposalRuns.map((p) => ({ ...p, lead: (leadMap.get(p.target_id ?? "") ?? null) as unknown as ProposalWithLead["lead"] })),
    followups: (followups.data ?? []) as unknown as FollowupWithContact[],
    errors: (errors.data ?? []) as AgentRun[],
  };
}

/** Chiffres et point du jour pour le tableau de bord. */
export async function getDashboardData() {
  await requireUser();
  const supabase = await createClient();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const [nouveaux, enAttente, relances, propositions, brief] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "nouveau"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "devis_envoye"),
    supabase.from("followups").select("id", { count: "exact", head: true }).eq("status", "a_faire").lte("due_at", endOfToday.toISOString()),
    supabase.from("agent_runs").select("id", { count: "exact", head: true }).eq("agent", "pipeline").eq("status", "propose"),
    supabase.from("agent_runs").select(RUN_FIELDS).eq("agent", "point_du_jour").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
    counts: {
      nouveaux: nouveaux.count ?? 0,
      devisEnAttente: enAttente.count ?? 0,
      relancesDuJour: relances.count ?? 0,
      propositions: propositions.count ?? 0,
    },
    brief: (brief.data ?? null) as AgentRun<DailyBrief> | null,
  };
}
