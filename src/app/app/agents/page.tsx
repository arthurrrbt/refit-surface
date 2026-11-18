import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AlertTriangle, Bot, CheckCircle2, Clock, FileText } from "lucide-react";
import { getAgentsOverview, SCHEDULED_AGENTS } from "@/lib/agents/data";
import { contactName } from "@/lib/leads";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { BriefCard, FollowupCard, ProposalCard } from "./components";

export const metadata: Metadata = { title: "Agents IA" };

const dateTimeFr = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export default function AgentsPage() {
  return (
    <>
      <PageHeader title="Agents IA">
        Vos agents travaillent avec votre abonnement Claude, depuis votre ordinateur, à heures fixes (l&apos;application
        Claude doit être ouverte). Ils préparent analyses, relances et rapports : rien n&apos;est envoyé sans votre
        validation. Pour leur demander une tâche, écrivez à Claude.
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const { rounds, brief, proposals, followups, errors, reports } = await getAgentsOverview();
  // Dernier passage de chaque agent : son dernier rapport (ou, pour la tournée, la dernière tournée)
  const lastRun = (key: string) => (key === "tournee" ? rounds[0]?.created_at : reports.get(`rapport:${key}`)?.created_at);

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <BriefCard run={brief} />

      <section>
        <h2 className="font-display text-lg font-semibold">Vos agents</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SCHEDULED_AGENTS.map((a) => {
            const last = lastRun(a.key);
            return (
              <li key={a.key} className="rounded-sm bg-paper p-4 text-sm shadow-sm">
                <p className="flex items-center gap-2 font-display font-semibold">
                  <Bot className="size-4 text-accent-strong" /> {a.name}
                </p>
                <p className="mt-1 text-ink/70">{a.role}</p>
                <p className="mt-2 text-xs text-ink/60">
                  {a.when} · {last ? `dernier passage le ${dateTimeFr.format(new Date(last))}` : "pas encore passé"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {reports.size > 0 && (
        <Section title="Derniers rapports" empty="">
          {SCHEDULED_AGENTS.filter((a) => reports.has(`rapport:${a.key}`)).map((a) => {
            const r = reports.get(`rapport:${a.key}`)!;
            return (
              <details key={a.key} className="group rounded-sm bg-paper shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm [&::-webkit-details-marker]:hidden">
                  <FileText className="size-4 shrink-0 text-accent-strong" />
                  <span className="font-semibold">{a.name}</span>
                  <span className="truncate text-ink/60">— {r.output?.titre}</span>
                  <span className="ml-auto shrink-0 text-xs text-ink/50">{dateTimeFr.format(new Date(r.created_at))}</span>
                </summary>
                <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap border-t border-ink/10 p-4 font-sans text-sm leading-relaxed text-ink/80">
                  {r.output?.markdown}
                </pre>
              </details>
            );
          })}
        </Section>
      )}

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
        {children.length ? children : <p className="rounded-sm bg-paper p-4 text-sm text-ink/60 shadow-sm">{empty}</p>}
      </div>
    </section>
  );
}
