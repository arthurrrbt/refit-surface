import Link from "next/link";
import { AlertTriangle, CalendarClock, Mail, MessageSquare, Phone, Sparkles } from "lucide-react";
import type { AgentRun, DailyBrief, Followup, QualificationOutput, StatusProposal } from "@/lib/agents/data";
import { faisabiliteLabels, prochaineActionLabels } from "@/lib/agents/qualification-schema";
import { leadStatusLabels, type LeadStatus } from "@/lib/leads";
import { deciderProposition, majRelance } from "./actions";
import { CopyButton, PendingButton } from "./ui";

const dateFr = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
const dateTimeFr = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export function mailtoHref(email: string | null | undefined, subject: string, body: string) {
  return `mailto:${email ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-ink/30";
}

/** Analyse de l'agent Qualification sur la fiche prospect. */
export function QualificationPanel({ run, email }: { run: AgentRun<QualificationOutput>; email: string | null }) {
  if (run.status === "erreur" || !run.output) {
    return (
      <p className="flex items-start gap-2 text-sm text-red-600">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Dernière analyse en échec : {run.error ?? "erreur inconnue"}
      </p>
    );
  }
  const q = run.output;
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-bold">{q.score}</span>
          <div className="w-28">
            <div className="h-2 rounded-full bg-ink/10">
              <div className={`h-2 rounded-full ${scoreColor(q.score)}`} style={{ width: `${q.score}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink/50">Priorité {q.priorite}</p>
          </div>
        </div>
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold">Faisabilité : {faisabiliteLabels[q.faisabilite]}</span>
        {q.surface_m2 ? <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold">≈ {q.surface_m2} m²</span> : null}
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-strong">
          → {prochaineActionLabels[q.prochaine_action]}
        </span>
      </div>

      <p className="text-ink/80">{q.resume}</p>
      <p className="text-xs text-ink/50">{q.justification_score}</p>

      {q.observations_photos && (
        <div>
          <p className="font-semibold">Ce que montrent les photos</p>
          <p className="mt-1 text-ink/70">{q.observations_photos}</p>
        </div>
      )}
      {q.points_vigilance.length > 0 && (
        <div>
          <p className="font-semibold">Points de vigilance</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink/70">
            {q.points_vigilance.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      {q.questions_a_poser.length > 0 && (
        <div>
          <p className="font-semibold">Questions à poser</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink/70">
            {q.questions_a_poser.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-sm border border-ink/10 bg-mist/60 p-4">
        <p className="flex items-center gap-2 font-semibold">
          <Mail className="size-4" /> Brouillon de réponse
        </p>
        <p className="mt-2 text-xs text-ink/50">Objet : {q.brouillon_email.objet}</p>
        <p className="mt-2 whitespace-pre-line text-ink/80">{q.brouillon_email.corps}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={mailtoHref(email, q.brouillon_email.objet, q.brouillon_email.corps)} className="inline-flex items-center gap-2 rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-paper">
            <Mail className="size-4" /> Ouvrir dans Outlook
          </a>
          <CopyButton text={q.brouillon_email.corps} />
        </div>
      </div>
      <p className="text-xs text-ink/40">Analyse du {dateTimeFr.format(new Date(run.created_at))}</p>
    </div>
  );
}

/** Proposition de changement de statut à valider. */
export function ProposalCard({ run, leadLink }: { run: AgentRun<StatusProposal>; leadLink?: { href: string; label: string } }) {
  const p = run.output;
  if (!p) return null;
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-accent/30 bg-paper p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">
          <Sparkles className="mr-1 inline size-4 text-accent-strong" />
          Passer en « {leadStatusLabels[p.statut as LeadStatus] ?? p.statut} »
          {leadLink && (
            <>
              {" "}—{" "}
              <Link href={leadLink.href} className="underline">
                {leadLink.label}
              </Link>
            </>
          )}
        </p>
        <p className="mt-1 text-ink/60">{p.raison}</p>
      </div>
      <form action={deciderProposition} className="flex gap-2">
        <input type="hidden" name="id" value={run.id} />
        <PendingButton name="decision" value="valide" variant="primary">
          Valider
        </PendingButton>
        <PendingButton name="decision" value="rejete">
          Rejeter
        </PendingButton>
      </form>
    </div>
  );
}

const channelIcon = { email: Mail, telephone: Phone, sms: MessageSquare };
const channelLabel = { email: "E-mail", telephone: "Appel", sms: "SMS" };

/** Relance programmée par l'agent, avec son brouillon. */
export function FollowupCard({
  followup,
  contact,
  leadLink,
}: {
  followup: Followup;
  contact?: { email: string | null; phone: string | null } | null;
  leadLink?: { href: string; label: string };
}) {
  const Icon = channelIcon[followup.channel];
  const overdue = followup.status === "a_faire" && new Date(followup.due_at) < new Date();
  const done = followup.status !== "a_faire";
  return (
    <div className={`rounded-sm border bg-paper p-4 text-sm ${done ? "border-ink/5 opacity-60" : overdue ? "border-amber-300" : "border-ink/10"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="size-4" />
        <span className="font-semibold">
          {channelLabel[followup.channel]} {followup.step}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs ${overdue ? "font-semibold text-amber-700" : "text-ink/50"}`}>
          <CalendarClock className="size-3.5" /> {dateFr.format(new Date(followup.due_at))}
          {overdue && " — à faire"}
        </span>
        {done && <span className="text-xs text-ink/50">({followup.status === "envoye" ? "fait" : "annulé"})</span>}
        {leadLink && (
          <Link href={leadLink.href} className="ml-auto text-xs underline">
            {leadLink.label}
          </Link>
        )}
      </div>
      {followup.draft && <p className="mt-2 whitespace-pre-line text-ink/75">{followup.draft}</p>}
      {!done && (
        <div className="mt-3 flex flex-wrap gap-2">
          {followup.channel === "email" && followup.draft && (
            <a href={mailtoHref(contact?.email, "REFIT Surface — votre projet", followup.draft)} className="inline-flex items-center gap-2 rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-paper">
              <Mail className="size-4" /> Ouvrir dans Outlook
            </a>
          )}
          {followup.channel !== "email" && contact?.phone && (
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-paper">
              <Phone className="size-4" /> Appeler
            </a>
          )}
          <form action={majRelance} className="flex gap-2">
            <input type="hidden" name="id" value={followup.id} />
            <PendingButton name="statut" value="envoye">
              Fait
            </PendingButton>
            <PendingButton name="statut" value="annule">
              Annuler
            </PendingButton>
          </form>
        </div>
      )}
    </div>
  );
}

/** Point du jour publié par l'Agent REFIT. */
export function BriefCard({ run }: { run: AgentRun<DailyBrief> | null }) {
  if (!run?.output) {
    return (
      <div className="rounded-sm bg-paper p-5 text-sm text-ink/60 shadow-sm">
        <p className="font-display font-semibold text-ink">Point du jour</p>
        <p className="mt-2">Pas encore de point du jour : l&apos;Agent REFIT le publie chaque matin à sa tournée.</p>
      </div>
    );
  }
  const b = run.output;
  return (
    <div className="rounded-sm bg-ink p-5 text-paper shadow-sm">
      <p className="eyebrow text-accent">Point du jour · {dateTimeFr.format(new Date(run.created_at))}</p>
      <p className="mt-2 font-display text-lg font-semibold">{b.titre}</p>
      {b.priorites.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-paper/85">
          {b.priorites.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      )}
      {b.commentaire && <p className="mt-3 text-sm text-paper/60">{b.commentaire}</p>}
    </div>
  );
}
