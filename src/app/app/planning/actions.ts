"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { EVENT_KINDS, eventKindLabels } from "@/lib/booking/config";
import { parisToUtc } from "@/lib/booking/time";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = { error?: string; ok?: boolean };

const eventSchema = z
  .object({
    kind: z.enum(EVENT_KINDS),
    title: z.string().trim().max(120).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
    start: z.string().regex(/^\d{2}:\d{2}$/, "Heure de début invalide."),
    end: z.string().regex(/^\d{2}:\d{2}$/, "Heure de fin invalide."),
    location: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((e) => e.end > e.start, { message: "L'heure de fin doit être après le début." });

/** Ajoute un événement au planning (rendez-vous, pose ou indisponibilité). */
export async function addEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireUser();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const e = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    kind: e.kind,
    title: e.title || eventKindLabels[e.kind],
    starts_at: parisToUtc(e.date, e.start).toISOString(),
    ends_at: parisToUtc(e.date, e.end).toISOString(),
    location: e.location || null,
    notes: e.notes || null,
  });
  if (error) return { error: "Enregistrement impossible." };
  refresh();
  return { ok: true };
}

export async function deleteEvent(formData: FormData) {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id.data);
  if (error) throw error;
  refresh();
}
