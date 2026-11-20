import { Check, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

// Remplacer ou habiller : les mêmes quatre points, dans le même ordre, pour comparer ligne à ligne
const comparison = [
  { replace: "Vous payez des éléments neufs, à la place des anciens", refit: "Vous ne payez que l'habillage des surfaces" },
  { replace: "Démolition, gravats et poussière", refit: "Ni démolition ni gravats" },
  { replace: "Une longue immobilisation", refit: "Quelques jours de pose" },
  { replace: "Les anciens éléments partent à la benne", refit: "L'existant est conservé : moins de déchets" },
];

// Chiffres vérifiables uniquement : nos engagements, et les données publiées par Cover Styl' (astérisque)
const figures = [
  { value: "Quelques jours", label: "de pose, sans gravats ni longue immobilisation" },
  { value: "1 interlocuteur", label: "de la visite à la pose" },
  { value: "Jusqu'à 75 %", label: "de CO₂ en moins qu'un remplacement complet*" },
  { value: "500+", label: "finitions au choix*" },
];

/** « Pourquoi rénover plutôt que remplacer » : chiffres clés et comparaison face à face. */
export function WhyRefitSection() {
  return (
    <section className="border-t border-line bg-ink-2">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="grid gap-14 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow">Pourquoi rénover plutôt que remplacer</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance sm:text-5xl">Le neuf, sans le chantier</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-paper/70">
            Vos meubles, vos vitrages et vos agencements restent en place : seules leurs surfaces changent. Vous ne payez
            que l&apos;habillage, sans démolition ni longue immobilisation.
          </p>
        </div>

        {/* Deux cartes face à face ; sur grand écran, leurs lignes partagent la même grille (subgrid) et restent alignées */}
        <div className="grid gap-4 sm:grid-cols-2 sm:grid-rows-[auto_repeat(4,auto)_auto] sm:gap-y-0">
          <div className="rounded-xl border border-line p-6 sm:row-span-6 sm:grid sm:grid-rows-subgrid sm:p-8">
            <p className="font-display text-lg font-medium text-paper/55">Remplacer</p>
            <ul className="contents">
              {comparison.map((row) => (
                <li key={row.replace} className="mt-4 flex items-start gap-3 border-t border-line pt-4 text-paper/55">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-line" aria-hidden>
                    <X className="size-3.5" strokeWidth={2} />
                  </span>
                  {row.replace}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-paper p-6 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] sm:row-span-6 sm:grid sm:grid-rows-subgrid sm:p-8">
            <p className="font-display text-lg font-medium">Habiller avec REFIT</p>
            <ul className="contents">
              {comparison.map((row) => (
                <li key={row.refit} className="mt-4 flex items-start gap-3 border-t border-ink/10 pt-4 font-medium">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-strong" aria-hidden>
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                  {row.refit}
                </li>
              ))}
            </ul>
            <div className="mt-8 self-end">
              <ButtonLink href="/rendez-vous" variant="dark" className="w-full">
                Prendre rendez-vous
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      {/* Les chiffres en bande pleine largeur : jamais coupés, quelle que soit la largeur d'écran */}
      <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-10 lg:grid-cols-4">
        {figures.map((f) => (
          <div key={f.value}>
            <dt className="sr-only">{f.label}</dt>
            <dd className="font-display text-lg font-medium tracking-tight whitespace-nowrap sm:text-2xl xl:text-3xl">{f.value}</dd>
            <dd className="mt-1 max-w-56 text-sm leading-snug text-paper/60">{f.label}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs text-paper/45">* Données publiées par Cover Styl&apos; pour ses revêtements adhésifs.</p>
      </div>
    </section>
  );
}
