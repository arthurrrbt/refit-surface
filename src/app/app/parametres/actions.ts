"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { ok?: boolean; error?: string };

const percent = z.coerce.number().min(0).max(100);
const amount = z.coerce.number().min(0).max(100000);

const settingsSchema = z.object({
  day_rate: amount,
  material_margin: percent,
  default_waste_rate: percent,
  travel_fee: amount,
  vat_rate: percent,
  quote_validity_days: z.coerce.number().int().min(1).max(365),
  deposit_rate: percent,
  invoice_due_days: z.coerce.number().int().min(0).max(90),
});

/** Les pourcentages sont saisis en % (35) et stockés en fraction (0.35), sauf la TVA. */
export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireUser();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Valeurs invalides : vérifiez les champs." };
  const s = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      day_rate: s.day_rate,
      material_margin: s.material_margin / 100,
      default_waste_rate: s.default_waste_rate / 100,
      travel_fee: s.travel_fee,
      vat_rate: s.vat_rate,
      quote_validity_days: s.quote_validity_days,
      deposit_rate: s.deposit_rate / 100,
      invoice_due_days: s.invoice_due_days,
    })
    .eq("id", true);
  if (error) return { error: "Enregistrement impossible." };
  refresh();
  return { ok: true };
}
