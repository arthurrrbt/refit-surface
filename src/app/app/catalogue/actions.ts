"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProductState = { ok?: boolean; error?: string };

const optionalPrice = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.number().min(0).max(10000).optional(),
);

const productSchema = z.object({
  id: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  brand: z.string().trim().min(1, "Indiquez la marque.").max(60),
  reference: z.string().trim().min(1, "Indiquez la référence.").max(60),
  name: z.string().trim().min(1, "Indiquez le nom.").max(120),
  category: z.string().trim().max(60).optional(),
  finish: z.string().trim().max(60).optional(),
  purchase_price_m2: optionalPrice,
  sale_price_m2: optionalPrice,
  waste_rate: z.coerce.number().min(0).max(100),
});

/** Crée ou met à jour une référence (pertes saisies en %). */
export async function saveProduct(_prev: ProductState, formData: FormData): Promise<ProductState> {
  await requireUser();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { id, ...p } = parsed.data;
  const fields = {
    brand: p.brand,
    reference: p.reference,
    name: p.name,
    category: p.category || null,
    finish: p.finish || null,
    purchase_price_m2: p.purchase_price_m2 ?? null,
    sale_price_m2: p.sale_price_m2 ?? null,
    waste_rate: p.waste_rate / 100,
  };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("products").update(fields).eq("id", id)
    : await supabase.from("products").insert(fields);
  if (error) return { error: error.code === "23505" ? "Cette référence existe déjà pour cette marque." : "Enregistrement impossible." };
  refresh();
  return { ok: true };
}

export async function toggleProduct(formData: FormData) {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), active: z.enum(["true", "false"]) })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from("products").update({ active: parsed.data.active === "true" }).eq("id", parsed.data.id);
  refresh();
}
