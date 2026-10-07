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
