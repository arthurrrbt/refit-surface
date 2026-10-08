import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft, FilePlus, FileText, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { listLeadQuotes } from "@/lib/quotes/data";
import { euro } from "@/lib/quotes/pricing";
import { getLeadAgentData } from "@/lib/agents/data";
import { LEAD_STATUSES, contactName, getLead, leadStatusLabels } from "@/lib/leads";
import Loading from "../../loading";
import { updateLeadStatus } from "../actions";
import { ContactForm } from "../ContactForm";
import { StatusBadge, UniversBadge } from "../StatusBadge";
import { FollowupCard, ProposalCard, QualificationPanel } from "../../agents/components";
import { PendingButton, RequalifyButton } from "../../agents/ui";
import { createQuoteFromLead } from "../../devis/actions";
import { TravelInfo } from "../../LiveData";
import type { SubmittedContact } from "@/lib/contacts";
import { QuoteStatusBadge } from "../../devis/QuoteStatusBadge";

export const metadata: Metadata = { title: "Prospect" };

// Laisse le temps à une nouvelle analyse IA lancée depuis la fiche
export const maxDuration = 120;

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Paris" });

function formatCm(mm: number | null) {
  return mm ? `${(mm / 10).toLocaleString("fr-FR")} cm` : "?";
}

export default function LeadPage({ params }: PageProps<"/app/prospects/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <LeadDetailView params={params} />
    </Suspense>
  );
}

async function LeadDetailView({ params }: { params: PageProps<"/app/prospects/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [lead, ai, quotes] = await Promise.all([getLead(id), getLeadAgentData(id), listLeadQuotes(id)]);
  if (!lead) notFound();
  const c = lead.contacts;

  return (
    <div className="space-y-4 p-4 sm:p-8">
      <Link href="/app/prospects" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="size-4" /> Prospects
      </Link>

      <div className="rounded-sm bg-paper p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <UniversBadge univers={lead.univers} />
          <StatusBadge status={lead.status} />
          {c?.kind === "professionnel" && <span className="text-xs text-ink/60">Professionnel</span>}
        </div>
        <h1 className="mt-3 font-display text-xl font-semibold">{contactName(c)}</h1>
        <p className="mt-1 text-sm text-ink/60">
          Reçu le {dateFormat.format(new Date(lead.created_at))} · {lead.source === "site" ? "formulaire du site" : lead.source}
        </p>

        {/* Actions rapides, au pouce */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
          {c?.phone && (
            <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 rounded-sm bg-ink px-4 py-3 text-sm font-semibold text-paper">
              <Phone className="size-4" /> Appeler
            </a>
          )}
          {c?.email && (
            <a href={`mailto:${c.email}`} className="flex items-center justify-center gap-2 rounded-sm border border-ink/15 px-4 py-3 text-sm font-semibold">
              <Mail className="size-4" /> E-mail
            </a>
          )}
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Info label="Téléphone">{c?.phone}</Info>
          <Info label="E-mail">{c?.email}</Info>
          <Info label="Localisation">
            {(c?.postal_code || c?.city) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {[c?.postal_code, c?.city].filter(Boolean).join(" ")}
              </span>
            )}
          </Info>
          <Info label="Accepte les communications">{c ? (c.marketing_consent ? "Oui" : "Non") : null}</Info>
          <Info label="Adresse">{c?.address}</Info>
          {c && (c.address || c.city) && (
            <Suspense fallback={null}>
              <TravelInfo address={[c.address, c.postal_code, c.city].filter(Boolean).join(" ")} />
            </Suspense>
          )}
          <Info label="SIRET">{c?.siret}</Info>
        </dl>

        {c && lead.details.contact_saisi && <SubmittedDiff saisi={lead.details.contact_saisi} contact={c} />}

        {c && (
          <details className="mt-4 border-t border-ink/10 pt-3">
            <summary className="cursor-pointer text-sm font-semibold text-accent-strong">Modifier les coordonnées</summary>
            <div className="mt-3">
              <ContactForm contact={c} />
            </div>
          </details>
        )}
      </div>

      <form action={updateLeadStatus} className="flex flex-wrap items-center gap-2 rounded-sm bg-paper p-4 shadow-sm">
        <input type="hidden" name="id" value={lead.id} />
        <label htmlFor="status" className="text-sm font-semibold">
          Statut
        </label>
        <select id="status" name="status" defaultValue={lead.status} className="rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm">
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {leadStatusLabels[s]}
            </option>
          ))}
        </select>
        <button className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-ink hover:bg-accent-strong hover:text-paper">
          Enregistrer
        </button>
      </form>

      <Section title={`Devis (${quotes.length})`}>
        <div className="space-y-2">
          {quotes.map((q) => (
            <Link key={q.id} href={`/app/devis/${q.id}`} className="flex items-center gap-3 rounded-sm border border-ink/10 p-3 text-sm hover:border-ink/30">
              <FileText className="size-4 text-ink/60" />
              <span className="font-semibold">{q.number ?? "Brouillon"}</span>
              <QuoteStatusBadge status={q.status} />
              <span className="ml-auto font-semibold">{euro.format(q.total_ttc)}</span>
            </Link>
          ))}
          <form action={createQuoteFromLead}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <PendingButton variant="primary" pendingLabel="Création…">
              <FilePlus className="size-4" /> Créer un devis
            </PendingButton>
          </form>
        </div>
      </Section>

      {ai.proposals.map((p) => (
        <ProposalCard key={p.id} run={p} />
      ))}

      <Section title="Analyse IA">
        <div className="space-y-4">
          {ai.qualification ? (
            <QualificationPanel run={ai.qualification} email={c?.email ?? null} />
          ) : (
            <p className="flex items-center gap-2 text-sm text-ink/60">
              <Sparkles className="size-4 text-accent-strong" /> Pas encore analysée : l&apos;agent s&apos;en charge à
              l&apos;arrivée de la demande ou lors de sa tournée du matin.
            </p>
          )}
          <RequalifyButton leadId={lead.id} label={ai.qualification ? "Relancer l'analyse" : "Analyser maintenant"} />
        </div>
      </Section>

      {ai.followups.length > 0 && (
        <Section title={`Relances (${ai.followups.length})`}>
          <div className="space-y-2">
            {ai.followups.map((f) => (
              <FollowupCard key={f.id} followup={f} contact={c} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Surfaces">
        <ul className="divide-y divide-ink/10 text-sm">
          {lead.surfaces.map((s, i) => (
            <li key={i} className="flex justify-between gap-4 py-2">
              <span className="font-medium">{s.type}</span>
              <span className="text-ink/60">
                {formatCm(s.largeur_mm)} × {formatCm(s.hauteur_mm)} · qté {s.quantite}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 text-sm">
          {lead.details.objectifs && lead.details.objectifs.length > 0 && (
            <Info label="Objectifs">{lead.details.objectifs.join(", ")}</Info>
          )}
          <Info label="Finitions">{lead.details.finitions}</Info>
          <Info label="Délai">{lead.details.delai}</Info>
        </dl>
      </Section>

      {lead.message && (
        <Section title="Message">
          <p className="whitespace-pre-line text-sm text-ink/80">{lead.message}</p>
        </Section>
      )}

      {lead.photos.length > 0 && (
        <Section title={`Photos (${lead.photos.length})`}>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {lead.photos.map(
              (p, i) =>
                p.url && (
                  <li key={p.id}>
                    <a href={p.url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-sm bg-mist">
                      {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire */}
                      <img src={p.url} alt={`Photo ${i + 1}`} className="size-full object-cover" loading="lazy" />
                    </a>
                  </li>
                ),
            )}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-sm bg-paper p-5 shadow-sm">
      <h2 className="font-display font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const diffLabels = {
  company: "Société",
  first_name: "Prénom",
  last_name: "Nom",
  phone: "Téléphone",
  postal_code: "Code postal",
  city: "Ville",
  address: "Adresse",
} as const;

/**
 * Coordonnées saisies dans la demande qui diffèrent de la fiche : jamais appliquées automatiquement
 * (un formulaire public ne peut pas modifier une fiche existante), à vérifier avant de corriger la fiche.
 */
function SubmittedDiff({ saisi, contact }: { saisi: SubmittedContact; contact: Record<string, unknown> }) {
  const norm = (v: unknown) => String(v ?? "").replace(/\s+/g, "").toLowerCase();
  const diffs = (Object.keys(diffLabels) as (keyof typeof diffLabels)[]).filter((k) => saisi[k] && norm(saisi[k]) !== norm(contact[k]));
  if (!diffs.length) return null;
  return (
    <div className="mt-4 rounded-sm border border-amber-300 bg-amber-50 p-3 text-sm">
      <p className="font-semibold text-amber-900">Coordonnées différentes saisies dans cette demande</p>
      <p className="text-xs text-amber-900/80">
        Non appliquées automatiquement : vérifiez auprès du client (par le numéro de la fiche) avant de modifier ses coordonnées.
      </p>
      <dl className="mt-2 space-y-1">
        {diffs.map((k) => (
          <div key={k} className="flex gap-2">
            <dt className="text-ink/60">{diffLabels[k]} :</dt>
            <dd className="min-w-0 break-words">{saisi[k]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex gap-2">
      <dt className="text-ink/60">{label} :</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
