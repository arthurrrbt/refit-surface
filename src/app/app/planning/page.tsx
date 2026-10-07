import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, Globe, MapPin, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { site } from "@/content/site";
import { eventKindLabels } from "@/lib/booking/config";
import { formatDayLong, formatTime, parisDate, parisToUtc } from "@/lib/booking/time";
import { env } from "@/lib/env";
import { getUpcomingEvents } from "@/lib/planning";
import { CopyButton } from "../agents/ui";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { deleteEvent } from "./actions";
import { EventForm } from "./EventForm";

export const metadata: Metadata = { title: "Planning" };

const kindStyles = {
  visite: "bg-sky-100 text-sky-800",
  metrage: "bg-accent/15 text-accent-strong",
  pose: "bg-emerald-100 text-emerald-800",
  autre: "bg-ink/10 text-ink/60",
};

export default function PlanningPage() {
  return (
    <>
      <PageHeader title="Planning">Visites, métrages, poses et indisponibilités des 60 prochains jours.</PageHeader>
      <Suspense fallback={<Loading />}>
        <Planning />
      </Suspense>
    </>
  );
}

async function Planning() {
  const days = await getUpcomingEvents();
  const today = parisDate();
  const icsToken = env("PLANNING_ICS_TOKEN");
  const icsUrl = icsToken ? `${site.url}/api/planning/ics?token=${icsToken}` : null;

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <EventForm today={today} />

      {days.length ? (
        <ol className="space-y-5">
          {days.map(({ date, events }) => (
            <li key={date}>
              <h2 className="font-display font-semibold first-letter:uppercase">
                {date === today ? "Aujourd'hui — " : ""}
                {formatDayLong.format(parisToUtc(date, "12:00"))}
              </h2>
              <ul className="mt-2 space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 rounded-sm bg-paper p-4 text-sm shadow-sm">
                    <span className="w-24 shrink-0 font-semibold tabular-nums">
                      {formatTime.format(new Date(e.starts_at))}–{formatTime.format(new Date(e.ends_at))}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${kindStyles[e.kind]}`}>{eventKindLabels[e.kind]}</span>
                        {e.booked_online && (
                          <span className="inline-flex items-center gap-1 text-xs text-ink/50">
                            <Globe className="size-3" /> réservé en ligne
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium">
                        {e.lead_id ? (
                          <Link href={`/app/prospects/${e.lead_id}`} className="underline">
                            {e.title}
                          </Link>
                        ) : (
                          e.title
                        )}
                      </p>
                      {e.location && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-ink/60 hover:text-ink"
                        >
                          <MapPin className="size-3.5" /> {e.location}
                        </a>
                      )}
                      {e.notes && <p className="mt-1 whitespace-pre-line text-ink/60">{e.notes}</p>}
                    </div>
                    <form action={deleteEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <ConfirmSubmit message={`Supprimer « ${e.title} » du planning ?`}>
                        <Trash2 className="size-4" />
                        <span className="sr-only">Supprimer</span>
                      </ConfirmSubmit>
                    </form>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col items-center rounded-sm bg-paper p-10 text-center text-ink/60 shadow-sm">
          <CalendarDays className="size-8 text-ink/30" />
          <p className="mt-3">Rien de prévu pour l&apos;instant.</p>
        </div>
      )}

      <section className="rounded-sm bg-paper p-5 text-sm shadow-sm">
        <h2 className="font-display font-semibold">Voir ce planning dans Outlook</h2>
        {icsUrl ? (
          <>
            <p className="mt-2 text-ink/60">
              Dans Outlook : <em>Ajouter un calendrier → À partir d&apos;Internet</em>, puis collez cette adresse. Le
              planning s&apos;y met à jour automatiquement (fonctionne une fois le site en ligne). Gardez cette adresse
              privée.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="max-w-full truncate rounded-sm bg-mist px-2 py-1.5 text-xs">{icsUrl}</code>
              <CopyButton text={icsUrl} />
            </div>
          </>
        ) : (
          <p className="mt-2 text-ink/60">Ajoutez PLANNING_ICS_TOKEN dans la configuration pour activer l&apos;abonnement.</p>
        )}
      </section>
    </div>
  );
}
