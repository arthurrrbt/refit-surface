import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AlertTriangle, Bot, CheckCircle2, Clock } from "lucide-react";
import { getAgentsOverview } from "@/lib/agents/data";
import { contactName } from "@/lib/leads";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { BriefCard, FollowupCard, ProposalCard } from "./components";
import { RoundButton } from "./ui";

export const metadata: Metadata = { title: "Agents IA" };

// La tournée lancée à la main peut durer quelques minutes
export const maxDuration = 300;

const dateTimeFr = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export default function AgentsPage() {
  return (
    <>
      <PageHeader title="Agents IA">
        L&apos;Agent REFIT fait sa tournée chaque matin : il qualifie les demandes, prépare les relances et
        propose les changements de statut. Rien n&apos;est envoyé sans votre validation.
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const { rounds, brief, proposals, followups, errors } = await getAgentsOverview();
  const lastRound = rounds[0];

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <BriefCard run={brief} />
        <div className="rounded-sm bg-paper p-5 shadow-sm lg:w-80">
          <p className="flex items-center gap-2 font-display font-semibold">
            <Bot className="size-5 text-accent-strong" /> Agent REFIT
          </p>
          <p className="mt-2 text-sm text-ink/60">
            {lastRound
              ? `Dernière tournée : ${dateTimeFr.format(new Date(lastRound.created_at))} — ${
                  lastRound.status === "execute" ? "terminée" : lastRound.status === "erreur" ? "en échec" : "en cours"
                }`
              : "Aucune tournée pour l'instant."}
          </p>
          <div className="mt-4">
            <RoundButton />
          </div>
        </div>
      </div>

      <Section title={`Propositions à valider (${proposals.length})`} empty="Aucune proposition en attente.">
        {proposals.map((p) => (
          <ProposalCard
            key={p.id}
            run={p}
            leadLink={p.lead ? { href: `/app/prospects/${p.lead.id}`, label: contactName(p.lead.contacts) } : undefined}
          />
        ))}
      </Section>

      <Section title={`Relances à faire (${followups.length})`} empty="Aucune relance programmée.">
        {followups.map((f) => (
          <FollowupCard
            key={f.id}
            followup={f}
            contact={f.leads?.contacts}
            leadLink={f.leads ? { href: `/app/prospects/${f.leads.id}`, label: contactName(f.leads.contacts) } : undefined}
          />
        ))}
      </Section>

      <Section title="Historique des tournées" empty="Aucune tournée.">
        {rounds.map((r) => (
          <div key={r.id} className="rounded-sm bg-paper p-4 text-sm shadow-sm">
            <p className="flex items-center gap-2 font-semibold">
              {r.status === "execute" ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : r.status === "erreur" ? (
                <AlertTriangle className="size-4 text-red-600" />
              ) : (
                <Clock className="size-4 text-amber-600" />
              )}
              {dateTimeFr.format(new Date(r.created_at))}
            </p>
            {r.error && <p className="mt-1 text-red-600">{r.error}</p>}
            {r.output?.actions && r.output.actions.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-ink/60">
                {r.output.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
            {r.output?.conclusion && <p className="mt-2 whitespace-pre-line text-ink/70">{r.output.conclusion}</p>}
          </div>
        ))}
      </Section>

      {errors.length > 0 && (
        <Section title="Dernières erreurs" empty="">
          {errors.map((e) => (
            <p key={e.id} className="flex items-start gap-2 rounded-sm bg-paper p-3 text-sm text-red-700 shadow-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {dateTimeFr.format(new Date(e.created_at))} · {e.agent} : {e.error}
              </span>
            </p>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {children.length ? children : <p className="rounded-sm bg-paper p-4 text-sm text-ink/50 shadow-sm">{empty}</p>}
      </div>
    </section>
  );
}
