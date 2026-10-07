"use server";

import { z } from "zod";
import { getAvailableSlots } from "@/lib/booking/slots";
import { upsertContact } from "@/lib/contacts";
import { createAdminClient } from "@/lib/supabase/admin";

const bookingSchema = z
  .object({
    start: z.iso.datetime(),
    univers: z.enum(["home", "glass", "pro", "boat"]).optional(),
    kind: z.enum(["particulier", "professionnel"]),
    company: z.string().trim().max(120).optional(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().max(200),
    phone: z.string().trim().min(6).max(30),
    address: z.string().trim().min(3, "Indiquez l'adresse du rendez-vous.").max(200),
    postalCode: z.string().trim().max(10).optional(),
    city: z.string().trim().min(1, "Indiquez la ville.").max(80),
    message: z.string().trim().max(2000).optional(),
    marketingConsent: z.boolean(),
    website: z.string().optional(), // piège à robots
  })
  .refine((d) => d.kind === "particulier" || Boolean(d.company), {
    message: "Indiquez le nom de votre établissement.",
  });

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingResult =
  | { ok: true; event: { id: string; start: string; end: string; location: string } }
  | { ok: false; error: string };

export async function bookAppointment(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  const d = parsed.data;
  if (d.website) return { ok: false, error: "Réservation impossible." };

  // Le créneau doit toujours être libre au moment de valider
  const slot = (await getAvailableSlots()).flatMap((day) => day.slots).find((s) => s.start === new Date(d.start).toISOString());
  if (!slot) return { ok: false, error: "Ce créneau n'est plus disponible : choisissez-en un autre." };

  const db = createAdminClient();
  const location = [d.address, [d.postalCode, d.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  try {
    const contactId = await upsertContact(db, d);
    const { data: lead, error: leadError } = await db
      .from("leads")
      .insert({ contact_id: contactId, univers: d.univers ?? null, status: "rdv", source: "site", message: d.message || null })
      .select("id")
      .single();
    if (leadError) throw leadError;

    const name = d.kind === "professionnel" && d.company ? d.company : `${d.firstName} ${d.lastName}`;
    const { data: event, error: eventError } = await db
      .from("events")
      .insert({
        kind: "metrage",
        title: `Visite & métrage — ${name}`,
        starts_at: slot.start,
        ends_at: slot.end,
        lead_id: lead.id,
        location,
        notes: [`Tél. ${d.phone}`, d.message].filter(Boolean).join("\n"),
        booked_online: true,
      })
      .select("id")
      .single();
    if (eventError) {
      await db.from("leads").delete().eq("id", lead.id);
      // 23P01 : chevauchement refusé par la base (réservation simultanée)
      if (eventError.code === "23P01") return { ok: false, error: "Ce créneau vient d'être réservé : choisissez-en un autre." };
      throw eventError;
    }
    return { ok: true, event: { id: event.id, start: slot.start, end: slot.end, location } };
  } catch (error) {
    console.error("bookAppointment", error);
    return { ok: false, error: "La réservation n'a pas pu être enregistrée. Réessayez ou appelez-nous." };
  }
}
