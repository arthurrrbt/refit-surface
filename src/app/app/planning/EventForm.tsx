"use client";

import { useActionState } from "react";
import { EVENT_KINDS, eventKindLabels } from "@/lib/booking/config";
import { PendingButton } from "../agents/ui";
import { addEvent, type EventFormState } from "./actions";

const field = "mt-1 block w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";

export function EventForm({ today }: { today: string }) {
  const [state, action] = useActionState<EventFormState, FormData>(addEvent, {});
  return (
    // React réinitialise les champs du formulaire après chaque action réussie
    <form action={action} className="grid gap-3 rounded-sm bg-paper p-4 shadow-sm sm:grid-cols-6">
      <label className="text-xs font-semibold sm:col-span-2">
        Type
        <select name="kind" defaultValue="autre" className={field}>
          {EVENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {eventKindLabels[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold sm:col-span-4">
        Intitulé
        <input name="title" placeholder="Pose cuisine M. Martin, congés…" className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-2">
        Date
        <input type="date" name="date" required min={today} defaultValue={today} className={field} />
      </label>
      <label className="text-xs font-semibold">
        Début
        <input type="time" name="start" required defaultValue="08:00" className={field} />
      </label>
      <label className="text-xs font-semibold">
        Fin
        <input type="time" name="end" required defaultValue="18:00" className={field} />
      </label>
      <label className="text-xs font-semibold sm:col-span-2">
        Lieu
        <input name="location" className={field} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-6">
        <PendingButton variant="primary" pendingLabel="Ajout…">
          Ajouter au planning
        </PendingButton>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.ok && <p className="text-sm text-emerald-700">Ajouté.</p>}
        <p className="text-xs text-ink/50">Les créneaux occupés ne sont plus proposés aux clients sur le site.</p>
      </div>
    </form>
  );
}
