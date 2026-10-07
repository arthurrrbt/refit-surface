"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { univers as universList } from "@/content/univers";
import { preparePhoto } from "@/lib/devis/photos";
import { galleryPublicUrl, type GalleryProject } from "@/lib/gallery-shared";
import { createClient } from "@/lib/supabase/client";
import { saveProject } from "./actions";

type Side = "avant" | "apres";

/** Chemin unique d'une photo dans le stockage de la galerie. */
function newPhotoPath(folder: string, side: Side, type: string) {
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return `projets/${folder}/${side}-${Date.now()}.${ext}`;
}

const field = "mt-1.5 block w-full rounded-sm border border-ink/15 bg-paper px-3 py-2.5 text-sm focus:border-accent focus:outline-none";

export function ProjectForm({ project }: { project?: GalleryProject }) {
  const router = useRouter();
  // Dossier de stockage : l'identifiant de la réalisation, ou une clé provisoire à la création
  const [folder] = useState(() => project?.id ?? crypto.randomUUID());
  const [paths, setPaths] = useState<Record<Side, string | null>>({
    avant: project?.before_path ?? null,
    apres: project?.after_path ?? null,
  });
  const [previews, setPreviews] = useState<Record<Side, string | null>>({
    avant: project?.before_path ? galleryPublicUrl(project.before_path) : null,
    apres: project?.after_path ? galleryPublicUrl(project.after_path) : null,
  });
  const [uploading, setUploading] = useState<Side | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function upload(side: Side, file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(side);
    try {
      const photo = await preparePhoto(file);
      const path = newPhotoPath(folder, side, photo.type);
      const { error: uploadError } = await createClient().storage.from("gallery").upload(path, photo, { contentType: photo.type });
      if (uploadError) throw new Error("Envoi de la photo impossible.");
      setPaths((p) => ({ ...p, [side]: path }));
      setPreviews((p) => ({ ...p, [side]: URL.createObjectURL(photo) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo illisible.");
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await saveProject({
      id: project?.id,
      title: String(formData.get("title") ?? ""),
      univers: String(formData.get("univers") ?? "") as "home",
      city: String(formData.get("city") ?? ""),
      description: String(formData.get("description") ?? ""),
      before_path: paths.avant,
      after_path: paths.apres,
      published: formData.get("published") === "on",
      clientConsent: formData.get("clientConsent") === "on",
    });
    setSaving(false);
    if (!result.ok) return setError(result.error);
    setSaved(true);
    if (!project) router.replace(`/app/realisations/${result.id}`);
  }

  return (
    <form action={handleSubmit} className="space-y-5 rounded-sm bg-paper p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold sm:col-span-2">
          Titre
          <input name="title" required defaultValue={project?.title} placeholder="Cuisine chêne clair à Dinard" className={field} />
        </label>
        <label className="block text-sm font-semibold">
          Univers
          <select name="univers" required defaultValue={project?.univers ?? ""} className={field}>
            <option value="" disabled>
              Choisir…
            </option>
            {universList.map((u) => (
              <option key={u.slug} value={u.slug}>
                {u.name} — {u.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Ville
          <input name="city" defaultValue={project?.city ?? ""} className={field} />
        </label>
        <label className="block text-sm font-semibold sm:col-span-2">
          Description
          <textarea
            name="description"
            rows={3}
            defaultValue={project?.description ?? ""}
            placeholder="Revêtement Cover Styl' finition chêne naturel sur façades et plan de travail, posé en 2 jours."
            className={field}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["avant", "apres"] as const).map((side) => (
          <label key={side} className="block cursor-pointer">
            <span className="text-sm font-semibold">{side === "avant" ? "Photo avant" : "Photo après"}</span>
            <span className="relative mt-1.5 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm border border-dashed border-ink/25 bg-mist text-xs text-ink/60">
              {previews[side] ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu local ou stockage public
                <img src={previews[side]!} alt="" className="absolute inset-0 size-full object-cover" />
              ) : null}
              <span className="relative flex items-center gap-2 rounded-sm bg-paper/90 px-3 py-1.5">
                {uploading === side ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                {uploading === side ? "Envoi…" : previews[side] ? "Changer" : "Ajouter"}
              </span>
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading !== null}
              onChange={(e) => {
                void upload(side, e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-ink/60">Astuce : même cadrage avant et après, pour un comparatif saisissant.</p>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="published" defaultChecked={project?.published} className="size-4 accent-accent" />
        Publier sur le site
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="clientConsent" defaultChecked={project?.published} className="mt-0.5 size-4 accent-accent" />
        <span>
          J&apos;ai obtenu l&apos;accord écrit du client pour publier ces photos et la ville du chantier (obligatoire pour publier ;
          conservez cet accord, par exemple un e-mail).
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Enregistré.</p>}

      <button
        disabled={saving || uploading !== null}
        className="inline-flex items-center gap-2 rounded-sm bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        Enregistrer
      </button>
    </form>
  );
}
