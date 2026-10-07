import "server-only";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type JobStatus = "a_planifier" | "planifie" | "en_cours" | "termine";

export const jobStatusLabels: Record<JobStatus, string> = {
  a_planifier: "À planifier",
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
};

export type JobMaterial = {
  id: string;
  product_id: string | null;
  description: string;
  quantity_m2: number;
  status: "a_commander" | "commande" | "recu";
  ordered_at: string | null;
  received_at: string | null;
  products: { brand: string; reference: string; name: string; roll_width_mm: number | null } | null;
};

export type JobPhoto = { id: string; stage: "avant" | "pendant" | "apres" | null; storage_path: string; url: string | null; created_at: string };

export type JobRow = {
  id: string;
  title: string;
  univers: string | null;
  status: JobStatus;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  labour_days: number | null;
  notes: string | null;
  quote_id: string | null;
  lead_id: string | null;
  contact_id: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  contacts: { company: string | null; first_name: string | null; last_name: string | null; phone: string | null; email: string | null; city: string | null } | null;
  quotes: { number: string | null; total_ttc: number } | null;
  job_materials: JobMaterial[];
  photos: JobPhoto[];
  gallery_project_id: string | null;
};

export async function listJobs() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, univers, status, start_date, end_date, created_at, contacts(company, first_name, last_name, city), job_materials(status)")
    .order("start_date", { ascending: true, nullsFirst: true })
    .limit(300);
  if (error) throw error;
  return data as unknown as (Pick<JobRow, "id" | "title" | "univers" | "status" | "start_date" | "end_date" | "created_at"> & {
    contacts: { company: string | null; first_name: string | null; last_name: string | null; city: string | null } | null;
    job_materials: { status: JobMaterial["status"] }[];
  })[];
}

export async function getJob(id: string): Promise<JobRow | null> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "*, contacts(company, first_name, last_name, phone, email, city), quotes!jobs_quote_id_fkey(number, total_ttc), job_materials(*, products(brand, reference, name, roll_width_mm))",
    )
    .eq("id", id)
    .order("created_at", { referencedTable: "job_materials" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [{ data: photos }, { data: gallery }] = await Promise.all([
    supabase.from("lead_photos").select("id, stage, storage_path, created_at").eq("job_id", id).order("created_at"),
    supabase.from("gallery_projects").select("id").eq("job_id", id).maybeSingle(),
  ]);
  const rows = (photos ?? []) as Omit<JobPhoto, "url">[];
  let signed: { signedUrl: string | null }[] = [];
  if (rows.length) {
    const { data: urls } = await supabase.storage.from("lead-photos").createSignedUrls(rows.map((p) => p.storage_path), 60 * 60);
    signed = urls ?? [];
  }
  return {
    ...(data as Omit<JobRow, "photos" | "gallery_project_id">),
    photos: rows.map((p, i) => ({ ...p, url: signed[i]?.signedUrl ?? null })),
    gallery_project_id: (gallery?.id as string | undefined) ?? null,
  };
}
