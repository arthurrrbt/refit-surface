"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

export async function updateLeadStatus(formData: FormData) {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(LEAD_STATUSES) })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) throw error;
  refresh();
}

export type ContactFormState = { ok?: boolean; error?: string };

const optional = (max: number) => z.string().trim().max(max).optional();

const contactSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["particulier", "professionnel"]),
  company: optional(120),
  first_name: optional(80),
  last_name: optional(80),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: optional(30),
  address: optional(200),
  postal_code: optional(10),
  city: optional(80),
  siret: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => v === "" || /^\d{14}$/.test(v), "Le SIRET doit comporter 14 chiffres.")
    .optional(),
});

/** Met à jour les coordonnées d'un contact (adresse et SIRET nécessaires à la facturation). */
export async function updateContact(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  await requireUser();
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Coordonnées invalides." };
  const { id, ...c } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      kind: c.kind,
      company: c.company || null,
      first_name: c.first_name || null,
      last_name: c.last_name || null,
      email: c.email ? c.email.toLowerCase() : null,
      phone: c.phone || null,
      address: c.address || null,
      postal_code: c.postal_code || null,
      city: c.city || null,
      siret: c.siret || null,
    })
    .eq("id", id);
  if (error) return { error: "Enregistrement impossible." };
  refresh();
  return { ok: true };
}
