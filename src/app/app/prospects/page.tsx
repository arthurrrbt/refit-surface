import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Camera, ChevronRight, Inbox } from "lucide-react";
import { contactName, listLeads } from "@/lib/leads";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { StatusBadge, UniversBadge } from "./StatusBadge";

export const metadata: Metadata = { title: "Prospects" };

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export default function ProspectsPage() {
  return (
    <>
      <PageHeader title="Prospects">Demandes reçues, de la plus récente à la plus ancienne.</PageHeader>
      <Suspense fallback={<Loading />}>
        <LeadList />
      </Suspense>
    </>
  );
}

async function LeadList() {
  const leads = await listLeads();

  if (!leads.length) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex flex-col items-center rounded-sm bg-paper p-10 text-center text-ink/60 shadow-sm">
          <Inbox className="size-8 text-ink/30" />
          <p className="mt-3">Aucune demande pour l&apos;instant.</p>
          <p className="mt-1 text-sm">Les demandes du formulaire de devis du site apparaîtront ici.</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2 p-4 sm:p-8">
      {leads.map((lead) => {
        const photoCount = lead.lead_photos[0]?.count ?? 0;
        return (
          <li key={lead.id}>
            <Link
              href={`/app/prospects/${lead.id}`}
              className="flex items-center gap-4 rounded-sm bg-paper p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <UniversBadge univers={lead.univers} />
                  <StatusBadge status={lead.status} />
                </div>
                <p className="mt-2 truncate font-semibold">{contactName(lead.contacts)}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink/60">
                  <span>{dateFormat.format(new Date(lead.created_at))}</span>
                  {lead.contacts?.city && <span>{lead.contacts.city}</span>}
                  {photoCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Camera className="size-3.5" /> {photoCount}
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
  );
}
