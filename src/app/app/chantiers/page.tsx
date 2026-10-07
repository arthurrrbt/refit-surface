import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, ChevronRight, HardHat, Package } from "lucide-react";
import { contactName } from "@/lib/leads";
import { jobStatusLabels, listJobs, type JobStatus } from "@/lib/jobs/data";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { UniversBadge } from "../prospects/StatusBadge";

export const metadata: Metadata = { title: "Chantiers" };

const dateFr = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
const order: JobStatus[] = ["en_cours", "planifie", "a_planifier", "termine"];
const statusStyles: Record<JobStatus, string> = {
  a_planifier: "bg-amber-100 text-amber-800",
  planifie: "bg-sky-100 text-sky-800",
  en_cours: "bg-accent/15 text-accent-strong",
  termine: "bg-emerald-100 text-emerald-800",
};

export default function JobsPage() {
  return (
    <>
      <PageHeader title="Chantiers">Créés automatiquement à la signature d&apos;un devis.</PageHeader>
      <Suspense fallback={<Loading />}>
        <JobList />
      </Suspense>
    </>
  );
}

async function JobList() {
  const jobs = await listJobs();
  if (!jobs.length) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex flex-col items-center rounded-sm bg-paper p-10 text-center text-ink/60 shadow-sm">
          <HardHat className="size-8 text-ink/30" />
          <p className="mt-3">Aucun chantier pour l&apos;instant.</p>
          <p className="mt-1 text-sm">Un chantier est créé dès qu&apos;un devis est signé.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-4 sm:p-8">
      {order.map((status) => {
        const group = jobs.filter((j) => j.status === status);
        if (!group.length) return null;
        return (
          <section key={status}>
            <h2 className="font-display font-semibold">
              {jobStatusLabels[status]} <span className="text-ink/40">({group.length})</span>
            </h2>
            <ul className="mt-2 space-y-2">
              {group.map((j) => {
                const toOrder = j.job_materials.filter((m) => m.status === "a_commander").length;
                return (
                  <li key={j.id}>
                    <Link href={`/app/chantiers/${j.id}`} className="flex items-center gap-4 rounded-sm bg-paper p-4 shadow-sm hover:shadow-md">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <UniversBadge univers={j.univers} />
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[j.status]}`}>{jobStatusLabels[j.status]}</span>
                          {toOrder > 0 && j.status !== "termine" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <Package className="size-3.5" /> {toOrder} à commander
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-semibold">{contactName(j.contacts)}</p>
                        <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink/55">
                          <span className="truncate">{j.title}</span>
                          {j.start_date && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3.5" /> {dateFr.format(new Date(j.start_date))}
                              {j.end_date && j.end_date !== j.start_date ? ` → ${dateFr.format(new Date(j.end_date))}` : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-ink/30" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
