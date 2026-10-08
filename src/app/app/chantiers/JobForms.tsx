"use client";

import { useActionState, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { preparePhoto } from "@/lib/devis/photos";
import type { JobPhoto } from "@/lib/jobs/data";
import { createClient } from "@/lib/supabase/client";
import { PendingButton } from "../agents/ui";
import { prepareAdminUpload } from "../uploads";
import { publishJobToGallery, registerJobPhotos, saveJobNotes, scheduleJob, type JobActionState } from "./actions";

const field = "mt-1 block w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";
const stages = [
  { value: "avant", label: "Avant" },
  { value: "pendant", label: "Pendant" },
  { value: "apres", label: "Après" },
] as const;

/** Chemin unique d'une photo de chantier (hors du rendu React). */
function photoPath(jobId: string, stage: string, index: number, type: string) {
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return `chantiers/${jobId}/${stage}-${Date.now()}-${index}.${ext}`;
}

export function ScheduleForm({ jobId, start, end, today }: { jobId: string; start: string | null; end: string | null; today: string }) {
  const [state, action] = useActionState<JobActionState, FormData>(scheduleJob, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="id" value={jobId} />
      <label className="text-xs font-semibold">
        Début de pose
        <input type="date" name="start_date" required defaultValue={start ?? today} className={field} />
      </label>
      <label className="text-xs font-semibold">
        Fin de pose
        <input type="date" name="end_date" required defaultValue={end ?? start ?? today} className={field} />
      </label>
      <label className="text-xs font-semibold">
        De
        <input type="time" name="start_time" required defaultValue="08:00" className={field} />
      </label>
      <label className="text-xs font-semibold">
        À
        <input type="time" name="end_time" required defaultValue="17:30" className={field} />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-4">
        <input type="checkbox" name="saturday" className="accent-accent" /> Travailler aussi le samedi
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-4">
        <PendingButton variant="primary" pendingLabel="Planification…">
          {start ? "Replanifier la pose" : "Planifier la pose"}
        </PendingButton>
        {state.ok && <p className="text-sm text-emerald-700">Jours de pose ajoutés au planning.</p>}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}

/** Photos du chantier par étape, prises directement au téléphone. */
export function JobPhotos({ jobId, photos, deleteAction }: { jobId: string; photos: JobPhoto[]; deleteAction: (formData: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(stage: (typeof stages)[number]["value"], files: FileList | null) {
    if (!files?.length) return;
    setBusy(stage);
    setError(null);
    try {
      const storage = createClient().storage.from("lead-photos");
      const paths: string[] = [];
      for (const [i, file] of Array.from(files).slice(0, 10).entries()) {
        const photo = await preparePhoto(file);
        const path = photoPath(jobId, stage, i, photo.type);
        const slot = await prepareAdminUpload("chantier", path);
        if ("error" in slot) throw new Error(slot.error);
        const { error: uploadError } = await storage.uploadToSignedUrl(slot.path, slot.token, photo, { contentType: photo.type });
        if (uploadError) throw new Error("Envoi d'une photo impossible.");
        paths.push(path);
      }
      const result = await registerJobPhotos(jobId, stage, paths);
      if (result.error) throw new Error(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {stages.map((st) => {
        const list = photos.filter((p) => (p.stage ?? "avant") === st.value);
        return (
          <div key={st.value}>
            <p className="text-sm font-semibold">
              {st.label} <span className="font-normal text-ink/60">({list.length})</span>
            </p>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {list.map((p) => (
                <li key={p.id} className="relative aspect-square overflow-hidden rounded-sm bg-mist">
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire */}
                      <img src={p.url} alt={`Photo ${st.label.toLowerCase()}`} className="size-full object-cover" loading="lazy" />
                    </a>
                  )}
                  <form action={deleteAction} className="absolute right-1 top-1">
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      aria-label="Supprimer la photo"
                      onClick={(e) => {
                        if (!window.confirm("Supprimer cette photo ?")) e.preventDefault();
                      }}
                      className="flex size-7 items-center justify-center rounded-full bg-ink/70 text-xs text-paper"
                    >
                      ✕
                    </button>
                  </form>
                </li>
              ))}
              <li>
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-ink/25 text-xs text-ink/60 hover:border-accent">
                  {busy === st.value ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
                  {busy === st.value ? "Envoi…" : "Ajouter"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    disabled={busy !== null}
                    onChange={(e) => {
                      void upload(st.value, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </li>
            </ul>
          </div>
        );
      })}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Choix des photos avant / après à publier dans la galerie du site. */
export function PublishForm({ jobId, photos }: { jobId: string; photos: JobPhoto[] }) {
  const [state, action] = useActionState<JobActionState, FormData>(publishJobToGallery, {});
  const [before, setBefore] = useState<string>(photos.find((p) => p.stage === "avant")?.id ?? "");
  const [after, setAfter] = useState<string>(photos.find((p) => p.stage === "apres")?.id ?? "");

  const picker = (label: string, value: string, set: (v: string) => void, prefer: string) => (
    <div>
      <p className="text-xs font-semibold">{label}</p>
      <ul className="mt-1 flex gap-2 overflow-x-auto pb-1">
        {[...photos].sort((a, b) => Number(b.stage === prefer) - Number(a.stage === prefer)).map((p) => (
          <li key={p.id} className="shrink-0">
            <button
              type="button"
              onClick={() => set(p.id)}
              aria-pressed={value === p.id}
              className={`block size-20 overflow-hidden rounded-sm border-2 ${value === p.id ? "border-accent" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire */}
              {p.url && <img src={p.url} alt="" className="size-full object-cover" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="job_id" value={jobId} />
      <input type="hidden" name="before_id" value={before} />
      <input type="hidden" name="after_id" value={after} />
      {picker("Photo avant", before, setBefore, "avant")}
      {picker("Photo après (même cadrage idéalement)", after, setAfter, "apres")}
      <PendingButton variant="primary" pendingLabel="Préparation…">
        Préparer la réalisation pour la galerie
      </PendingButton>
      <p className="text-xs text-ink/60">Un brouillon est créé dans Réalisations : relisez le titre et la description, puis publiez.</p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function NotesForm({ jobId, notes, address }: { jobId: string; notes: string; address: string }) {
  const [state, action] = useActionState<JobActionState, FormData>(saveJobNotes, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={jobId} />
      <label className="block text-xs font-semibold">
        Adresse du chantier
        <AddressAutocomplete name="address" defaultValue={address} tone="light" className={field} />
      </label>
      <label className="block text-xs font-semibold">
        Notes (accès, code portail, préparation, matériel à prévoir…)
        <textarea name="notes" rows={4} defaultValue={notes} className={field} />
      </label>
      <div className="flex items-center gap-3">
        <PendingButton pendingLabel="Enregistrement…">Enregistrer</PendingButton>
        {state.ok && <p className="text-sm text-emerald-700">Enregistré.</p>}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
