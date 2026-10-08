import "server-only";
import type { SubmittedContact } from "@/lib/contacts";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const LEAD_STATUSES = ["nouveau", "qualifie", "rdv", "devis_envoye", "gagne", "perdu"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadStatusLabels: Record<LeadStatus, string> = {
  nouveau: "Nouveau",
  qualifie: "Qualifié",
  rdv: "RDV planifié",
  devis_envoye: "Devis envoyé",
  gagne: "Gagné",
  perdu: "Perdu",
};

type Contact = {
  id: string;
  kind: "particulier" | "professionnel";
  company: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  siret: string | null;
  marketing_consent: boolean;
};

export type LeadListItem = {
  id: string;
  univers: string | null;
  status: LeadStatus;
  source: string | null;
  created_at: string;
  contacts: Pick<Contact, "kind" | "company" | "first_name" | "last_name" | "city" | "phone"> | null;
  lead_photos: { count: number }[];
};

export type LeadSurface = { type: string; largeur_mm: number | null; hauteur_mm: number | null; quantite: number };

export type LeadDetail = {
  id: string;
  univers: string | null;
  status: LeadStatus;
  source: string | null;
  message: string | null;
  surfaces: LeadSurface[];
  details: { objectifs?: string[]; finitions?: string | null; delai?: string | null; contact_saisi?: SubmittedContact };
  created_at: string;
  contacts: Contact | null;
  photos: { id: string; url: string | null }[];
};

export function contactName(c: Pick<Contact, "first_name" | "last_name" | "company"> | null) {
  if (!c) return "Contact inconnu";
  const person = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return c.company ? `${c.company}${person ? ` — ${person}` : ""}` : person || "Sans nom";
}

export async function listLeads(): Promise<LeadListItem[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, univers, status, source, created_at, contacts(kind, company, first_name, last_name, city, phone), lead_photos(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as LeadListItem[];
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, univers, status, source, message, surfaces, details, created_at, contacts(*), lead_photos(id, storage_path)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { lead_photos, ...lead } = data as unknown as Omit<LeadDetail, "photos"> & {
    lead_photos: { id: string; storage_path: string }[];
  };
  let photos: LeadDetail["photos"] = [];
  if (lead_photos.length) {
    const { data: signed } = await supabase.storage
      .from("lead-photos")
      .createSignedUrls(lead_photos.map((p) => p.storage_path), 60 * 60);
    photos = lead_photos.map((p, i) => ({ id: p.id, url: signed?.[i]?.signedUrl ?? null }));
  }
  return { ...lead, photos };
}
