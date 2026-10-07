import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { LEAD_STATUSES, contactName, getLead, leadStatusLabels } from "@/lib/leads";
import Loading from "../../loading";
import { updateLeadStatus } from "../actions";
import { StatusBadge, UniversBadge } from "../StatusBadge";

export const metadata: Metadata = { title: "Prospect" };

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
  const lead = await getLead(id);
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
          {c?.kind === "professionnel" && <span className="text-xs text-ink/50">Professionnel</span>}
        </div>
        <h1 className="mt-3 font-display text-xl font-semibold">{contactName(c)}</h1>
        <p className="mt-1 text-sm text-ink/50">
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
        </dl>
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

function Info({ label, children }: { label: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex gap-2">
      <dt className="text-ink/50">{label} :</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
