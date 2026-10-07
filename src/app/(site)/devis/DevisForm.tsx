"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Camera, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { univers as universList } from "@/content/univers";
import { MAX_PHOTOS, UNIVERS, delais, glassGoals, surfaceTypes, type UniversValue } from "@/lib/devis/schema";
import { photoExtension, preparePhoto } from "@/lib/devis/photos";
import { createClient } from "@/lib/supabase/client";
import { prepareDevisUpload, submitDevis } from "./actions";

type SurfaceRow = { type: string; largeur: string; hauteur: string; quantite: string };
type Photo = { file: File; preview: string };

const steps = ["Votre projet", "Photos", "Vos coordonnées"];
const emptySurface: SurfaceRow = { type: "", largeur: "", hauteur: "", quantite: "1" };

const input =
  "block w-full rounded-sm border border-line bg-ink px-3 py-2.5 text-paper placeholder:text-paper/30 focus:border-accent focus:outline-none";

function toNumber(value: string) {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function DevisForm() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("univers");
  const [step, setStep] = useState(0);
  const [univers, setUnivers] = useState<UniversValue | null>(
    UNIVERS.includes(initial as UniversValue) ? (initial as UniversValue) : null,
  );
  const [surfaces, setSurfaces] = useState<SurfaceRow[]>([{ ...emptySurface }]);
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [finitions, setFinitions] = useState("");
  const [delai, setDelai] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  // Libère les aperçus à la fermeture
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function goTo(next: number) {
    setError(null);
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateProject() {
    if (!univers) return "Choisissez un univers.";
    if (!surfaces.some((s) => s.type)) return "Indiquez au moins une surface à rénover.";
    return null;
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return setError(`${MAX_PHOTOS} photos maximum.`);
    setProcessing(true);
    const added: Photo[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      try {
        const prepared = await preparePhoto(file);
        added.push({ file: prepared, preview: URL.createObjectURL(prepared) });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Photo illisible.");
      }
    }
    setPhotos((prev) => [...prev, ...added]);
    setProcessing(false);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(formData: FormData) {
    const projectError = validateProject();
    if (projectError || !univers) return goTo(0);
    setError(null);
    setStatus("sending");

    try {
      let uploadId: string | undefined;
      let photoPaths: string[] = [];
      if (photos.length) {
        const prep = await prepareDevisUpload(photos.map((p) => photoExtension(p.file)));
        if ("error" in prep) throw new Error(prep.error);
        const storage = createClient().storage.from("lead-photos");
        const uploads = await Promise.all(
          prep.slots.map((slot, i) =>
            storage.uploadToSignedUrl(slot.path, slot.token, photos[i].file, {
              contentType: photos[i].file.type || "image/jpeg",
            }),
          ),
        );
        if (uploads.some((u) => u.error)) throw new Error("L'envoi des photos a échoué. Réessayez.");
        uploadId = prep.uploadId;
        photoPaths = prep.slots.map((s) => s.path);
      }

      const text = (name: string) => String(formData.get(name) ?? "").trim();
      const kind = text("kind") === "professionnel" ? "professionnel" : "particulier";
      const result = await submitDevis({
        univers,
        surfaces: surfaces
          .filter((s) => s.type)
          .map((s) => ({
            type: s.type,
            largeurCm: toNumber(s.largeur),
            hauteurCm: toNumber(s.hauteur),
            quantite: Math.max(1, Math.round(toNumber(s.quantite) ?? 1)),
          })),
        objectifs: univers === "glass" ? objectifs : [],
        finitions,
        delai,
        kind,
        company: text("company"),
        firstName: text("firstName"),
        lastName: text("lastName"),
        email: text("email"),
        phone: text("phone"),
        postalCode: text("postalCode"),
        city: text("city"),
        message: text("message"),
        marketingConsent: formData.get("marketingConsent") === "on",
        uploadId,
        photos: photoPaths,
        website: text("website"),
      } as Parameters<typeof submitDevis>[0]);

      if (!result.ok) throw new Error(result.error);
      setFirstName(text("firstName"));
      setStatus("done");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div ref={topRef} className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-sm border border-accent/40 bg-ink-2 p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-ink">
            <Check className="size-6" />
          </span>
          <h2 className="mt-6 font-display text-2xl font-semibold">Merci {firstName} !</h2>
          <p className="mt-3 text-paper/70">
            Votre demande est bien enregistrée. Nous l&apos;étudions et revenons vers vous rapidement pour
            convenir d&apos;une visite.
          </p>
          <Link href="/realisations" className={buttonClass("outline", "mt-8")}>
            Voir nos réalisations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-20 px-4 py-12 sm:px-6">
      {/* Étapes */}
      <ol className="mb-10 grid grid-cols-3 gap-2">
        {steps.map((label, i) => (
          <li key={label}>
            <span className={`block h-1 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />
            <span className={`mt-2 block text-xs ${i === step ? "text-paper" : "text-paper/60"}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      <form
        action={handleSubmit}
        onKeyDown={(e) => {
          // Entrée ne doit pas envoyer le formulaire avant la dernière étape
          if (e.key === "Enter" && step < 2 && !(e.target instanceof HTMLTextAreaElement)) e.preventDefault();
        }}
      >
        {/* Étape 1 : projet */}
        <div hidden={step !== 0} className="space-y-10">
          <Fieldset legend="Quel univers ?">
            <div className="grid grid-cols-2 gap-3">
              {universList.map((u) => (
                <button
                  key={u.slug}
                  type="button"
                  onClick={() => {
                    setUnivers(u.slug);
                    setSurfaces([{ ...emptySurface }]);
                  }}
                  aria-pressed={univers === u.slug}
                  className={`rounded-sm border p-4 text-left transition-colors ${
                    univers === u.slug ? "border-accent bg-accent/10" : "border-line hover:border-paper/40"
                  }`}
                >
                  <span className="block font-display text-sm font-bold uppercase tracking-[0.15em]">{u.name}</span>
                  <span className="mt-1 block text-xs text-paper/60">{u.title}</span>
                </button>
              ))}
            </div>
          </Fieldset>

          {univers && (
            <Fieldset legend="Quelles surfaces ?" hint="Des dimensions approximatives suffisent.">
              <ul className="space-y-3">
                {surfaces.map((s, i) => (
                  <li key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-sm border border-line bg-ink-2 p-3 sm:grid-cols-[2fr_1fr_1fr_0.7fr_auto]">
                    <select
                      aria-label="Type de surface"
                      value={s.type}
                      onChange={(e) => updateSurface(i, { type: e.target.value })}
                      className={`${input} col-span-1`}
                    >
                      <option value="">Type de surface…</option>
                      {surfaceTypes[univers].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setSurfaces((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : [{ ...emptySurface }]))}
                      aria-label="Retirer cette surface"
                      className="flex size-11 items-center justify-center text-paper/60 hover:text-red-400 sm:order-last"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <div className="col-span-2 grid grid-cols-3 gap-2 sm:contents">
                      <input
                        inputMode="decimal"
                        placeholder="Larg. (cm)"
                        aria-label="Largeur en cm"
                        value={s.largeur}
                        onChange={(e) => updateSurface(i, { largeur: e.target.value })}
                        className={input}
                      />
                      <input
                        inputMode="decimal"
                        placeholder="Haut. (cm)"
                        aria-label="Hauteur en cm"
                        value={s.hauteur}
                        onChange={(e) => updateSurface(i, { hauteur: e.target.value })}
                        className={input}
                      />
                      <input
                        inputMode="numeric"
                        placeholder="Qté"
                        aria-label="Quantité"
                        value={s.quantite}
                        onChange={(e) => updateSurface(i, { quantite: e.target.value })}
                        className={input}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              {surfaces.length < 20 && (
                <button
                  type="button"
                  onClick={() => setSurfaces((prev) => [...prev, { ...emptySurface }])}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-accent hover:text-paper"
                >
                  <Plus className="size-4" /> Ajouter une surface
                </button>
              )}
            </Fieldset>
          )}

          {univers === "glass" && (
            <Fieldset legend="Vos objectifs">
              <div className="flex flex-wrap gap-2">
                {glassGoals.map((g) => {
                  const on = objectifs.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setObjectifs((prev) => (on ? prev.filter((x) => x !== g) : [...prev, g]))}
                      className={`rounded-full border px-4 py-2 text-sm ${on ? "border-accent bg-accent/10 text-paper" : "border-line text-paper/70"}`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </Fieldset>
          )}

          {univers && univers !== "glass" && (
            <Fieldset legend="Finitions envisagées" hint="Bois, marbre, béton, uni mat… ou « je ne sais pas encore ».">
              <input value={finitions} onChange={(e) => setFinitions(e.target.value)} maxLength={500} className={input} />
            </Fieldset>
          )}

          {univers && (
            <Fieldset legend="Délai souhaité">
              <select value={delai} onChange={(e) => setDelai(e.target.value)} className={input}>
                <option value="">Choisir…</option>
                {delais.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Fieldset>
          )}
        </div>

        {/* Étape 2 : photos */}
        <div hidden={step !== 1} className="space-y-6">
          <Fieldset
            legend="Ajoutez des photos"
            hint={`Une vue d'ensemble et quelques détails de chaque surface (${MAX_PHOTOS} max). Facultatif, mais très utile pour estimer. Évitez de photographier des personnes ou des documents personnels.`}
          >
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photos.map((p, i) => (
                <li key={p.preview} className="relative aspect-square overflow-hidden rounded-sm border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) */}
                  <img src={p.preview} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={`Retirer la photo ${i + 1}`}
                    className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-ink/80 text-paper"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
              {photos.length < MAX_PHOTOS && (
                <li>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-paper/30 text-center text-xs text-paper/60 hover:border-accent hover:text-accent">
                    {processing ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
                    {processing ? "Préparation…" : "Ajouter"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      disabled={processing}
                      onChange={(e) => {
                        void addPhotos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </li>
              )}
            </ul>
          </Fieldset>
        </div>

        {/* Étape 3 : coordonnées */}
        <div hidden={step !== 2} className="space-y-6">
          <Fieldset legend="Vous êtes">
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="kind" value="particulier" defaultChecked className="accent-accent" />
                Particulier
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="kind" value="professionnel" className="accent-accent" />
                Professionnel
              </label>
            </div>
          </Fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" name="firstName" required autoComplete="given-name" />
            <Field label="Nom" name="lastName" required autoComplete="family-name" />
            <Field label="Société / établissement (pros)" name="company" autoComplete="organization" className="sm:col-span-2" />
            <Field label="E-mail" name="email" type="email" required autoComplete="email" />
            <Field label="Téléphone" name="phone" type="tel" required autoComplete="tel" />
            <Field label="Code postal" name="postalCode" autoComplete="postal-code" inputMode="numeric" />
            <Field label="Ville" name="city" autoComplete="address-level2" />
          </div>
          <label className="block">
            <span className="text-sm text-paper/80">Message (facultatif)</span>
            <textarea name="message" rows={4} maxLength={3000} className={`${input} mt-1.5`} />
          </label>
          {/* Piège à robots, invisible pour les humains */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <label className="flex items-start gap-3 text-sm text-paper/75">
            <input type="checkbox" name="marketingConsent" className="mt-1 accent-accent" />
            <span>Facultatif : je souhaite recevoir occasionnellement des conseils et réalisations REFIT Surface (désinscription à tout moment).</span>
          </label>
          <p className="text-xs leading-relaxed text-paper/70">
            Les informations marquées d&apos;un astérisque sont nécessaires pour étudier votre demande et vous recontacter. Elles sont
            utilisées uniquement par REFIT Surface pour établir votre devis et conservées 3 ans sans suite donnée. Vous pouvez y accéder, les
            corriger ou les supprimer : voir notre{" "}
            <Link href="/confidentialite" className="underline hover:text-accent">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-sm border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => goTo(step - 1)} disabled={status === "sending"}>
              Retour
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button
              type="button"
              disabled={processing}
              onClick={() => {
                const problem = step === 0 ? validateProject() : null;
                if (problem) setError(problem);
                else goTo(step + 1);
              }}
            >
              {step === 1 && photos.length === 0 ? "Continuer sans photo" : "Continuer"}
            </Button>
          ) : (
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Envoi…
                </>
              ) : (
                "Envoyer ma demande"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );

  function updateSurface(index: number, patch: Partial<SurfaceRow>) {
    setSurfaces((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
}

function Fieldset({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="font-display text-lg font-semibold">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-paper/50">{hint}</p>}
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  className = "",
  ...props
}: { label: string; className?: string } & ComponentProps<"input">) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-paper/80">
        {label}
        {props.required && <span className="text-accent"> *</span>}
      </span>
      <input {...props} className={`${input} mt-1.5`} />
    </label>
  );
}
