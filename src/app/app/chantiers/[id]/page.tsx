import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, FileText, Images, MapPin, Phone, Play, Receipt } from "lucide-react";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { parisDate } from "@/lib/booking/time";
import { contactName } from "@/lib/leads";
import { getJob, jobStatusLabels, type JobMaterial } from "@/lib/jobs/data";
import { CopyButton, PendingButton } from "../../agents/ui";
import Loading from "../../loading";
import { PageHeader } from "../../ModulePlaceholder";
import { UniversBadge } from "../../prospects/StatusBadge";
import { deleteJobPhoto, setJobStatus, setMaterialStatus } from "../actions";
import { JobPhotos, NotesForm, PublishForm, ScheduleForm } from "../JobForms";

export const metadata: Metadata = { title: "Chantier" };

const dateFr = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const qty = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

const materialSteps: Record<JobMaterial["status"], { label: string; next: JobMaterial["status"] | null; nextLabel: string; style: string }> = {
  a_commander: { label: "À commander", next: "commande", nextLabel: "Marquer commandé", style: "bg-amber-100 text-amber-800" },
  commande: { label: "Commandé", next: "recu", nextLabel: "Marquer reçu", style: "bg-sky-100 text-sky-800" },
  recu: { label: "Reçu", next: null, nextLabel: "", style: "bg-emerald-100 text-emerald-800" },
};

export default function JobPage({ params }: PageProps<"/app/chantiers/[id]">) {
  return (
    <>
      <PageHeader title="Chantier" />
      <Suspense fallback={<Loading />}>
        <JobView params={params} />
      </Suspense>
    </>
  );
}

async function JobView({ params }: { params: PageProps<"/app/chantiers/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const job = await getJob(id);
  if (!job) notFound();

  const c = job.contacts;
  const materials = job.job_materials;
  const orderText = materials
    .filter((m) => m.status === "a_commander")
    .map((m) => `- ${m.products ? `${m.products.brand} ${m.products.reference} (${m.products.name})` : m.description} : ${qty.format(m.quantity_m2)} m²`)
    .join("\n");
  const hasBefore = job.photos.some((p) => p.stage === "avant");
  const hasAfter = job.photos.some((p) => p.stage === "apres");

  return (
    <div className="max-w-4xl space-y-4 p-4 sm:p-8">
      <Link href="/app/chantiers" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="size-4" /> Chantiers
      </Link>

      <div className="rounded-sm bg-paper p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <UniversBadge univers={job.univers} />
          <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold">{jobStatusLabels[job.status]}</span>
        </div>
        <h1 className="mt-2 font-display text-xl font-semibold">{contactName(c)}</h1>
        <p className="text-sm text-ink/60">{job.title}</p>
        {job.start_date && (
          <p className="mt-1 text-sm first-letter:uppercase">
            {dateFr.format(new Date(`${job.start_date}T12:00:00Z`))}
            {job.end_date && job.end_date !== job.start_date ? ` → ${dateFr.format(new Date(`${job.end_date}T12:00:00Z`))}` : ""}
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
          {c?.phone && (
            <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 rounded-sm bg-ink px-4 py-3 text-sm font-semibold text-paper">
              <Phone className="size-4" /> Appeler
            </a>
          )}
          {job.address && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-sm border border-ink/15 px-4 py-3 text-sm font-semibold"
            >
              <MapPin className="size-4" /> Itinéraire
            </a>
          )}
          {job.quote_id && (
            <Link href={`/app/devis/${job.quote_id}`} className="flex items-center justify-center gap-2 rounded-sm border border-ink/15 px-4 py-3 text-sm font-semibold">
              <FileText className="size-4" /> Devis {job.quotes?.number}
            </Link>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
          {(job.status === "planifie" || job.status === "a_planifier") && (
            <form action={setJobStatus}>
              <input type="hidden" name="id" value={job.id} />
              <PendingButton name="status" value="en_cours" variant="primary">
                <Play className="size-4" /> Démarrer le chantier
              </PendingButton>
            </form>
          )}
          {job.status === "en_cours" && (
            <form action={setJobStatus}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="status" value="termine" />
              <ConfirmSubmit tone="primary" message="Marquer le chantier comme terminé ?">
                <CheckCircle2 className="size-4" /> Terminer le chantier
              </ConfirmSubmit>
            </form>
          )}
          {job.status === "termine" && job.quote_id && (
            <Link href={`/app/devis/${job.quote_id}`} className="inline-flex items-center gap-2 rounded-sm bg-accent px-3 py-2 text-sm font-semibold text-ink">
              <Receipt className="size-4" /> Facturer le solde
            </Link>
          )}
        </div>
      </div>

      <Section title="Planification de la pose">
        <ScheduleForm jobId={job.id} start={job.start_date} end={job.end_date} today={parisDate()} />
        {job.labour_days ? <p className="mt-2 text-xs text-ink/50">Durée prévue au devis : {qty.format(job.labour_days)} jour(s).</p> : null}
      </Section>

      <Section title={`Matière (${materials.length})`}>
        {materials.length ? (
          <>
            <ul className="divide-y divide-ink/10 text-sm">
              {materials.map((m) => {
                const step = materialSteps[m.status];
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{m.products ? `${m.products.brand} ${m.products.reference} — ${m.products.name}` : m.description}</p>
                      <p className="text-xs text-ink/50">
                        {m.description} · <strong className="text-ink">{qty.format(m.quantity_m2)} m²</strong> pertes comprises
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${step.style}`}>{step.label}</span>
                    {step.next && (
                      <form action={setMaterialStatus}>
                        <input type="hidden" name="id" value={m.id} />
                        <PendingButton name="status" value={step.next}>
                          {step.nextLabel}
                        </PendingButton>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
            {orderText && (
              <div className="mt-3 rounded-sm bg-mist p-3 text-sm">
                <p className="font-semibold">Bon de commande TEGO</p>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-ink/80">{orderText}</pre>
                <div className="mt-2">
                  <CopyButton text={`Commande REFIT Surface — chantier ${contactName(c)}\n${orderText}`} />
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-ink/50">Aucune ligne de revêtement dans le devis.</p>
        )}
      </Section>

      <Section title="Photos du chantier">
        <JobPhotos jobId={job.id} photos={job.photos} deleteAction={deleteJobPhoto} />
      </Section>

      <Section title="Galerie du site">
        {job.gallery_project_id ? (
          <Link href={`/app/realisations/${job.gallery_project_id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent-strong underline">
            <Images className="size-4" /> Voir la réalisation créée à partir de ce chantier
          </Link>
        ) : hasBefore && hasAfter ? (
          <PublishForm jobId={job.id} photos={job.photos} />
        ) : (
          <p className="text-sm text-ink/50">Ajoutez au moins une photo « Avant » et une photo « Après » pour publier ce chantier dans la galerie.</p>
        )}
      </Section>

      <Section title="Notes">
        <NotesForm jobId={job.id} notes={job.notes ?? ""} address={job.address ?? ""} />
      </Section>
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
