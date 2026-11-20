import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sailboat } from "lucide-react";
import { FinishesSection } from "@/components/site/FinishesSection";
import { InspirationCarousel } from "@/components/site/InspirationCarousel";
import { RecentProjects } from "@/components/site/RecentProjects";
import { CtaBand } from "@/components/site/CtaBand";
import { VideoCarousel } from "@/components/site/VideoCarousel";
import { ButtonLink } from "@/components/ui/Button";
import { saintMalo, universCardPhoto, videoCarousel } from "@/content/media";
import { hasPhone, site } from "@/content/site";
import { univers, type UniversSlug } from "@/content/univers";

// Chaque domaine présenté par la question que se pose le client
const problems: Record<UniversSlug, string> = {
  home: "Cuisine ou meubles datés ?",
  glass: "Trop de chaleur ou de vis-à-vis ?",
  pro: "Un établissement à rafraîchir ?",
  boat: "Un intérieur de bateau fatigué ?",
};

/** Photo de la carte, ou un visuel neutre si un univers n'a pas encore de photo. */
function UniversVisual({ slug }: { slug: UniversSlug }) {
  const photo = universCardPhoto[slug];
  if (!photo) {
    return (
      <div className="flex size-full items-center justify-center bg-linear-to-b from-ink-3 to-ink-2" aria-hidden>
        <Sailboat className="size-12 text-stone" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      placeholder="blur"
      className="object-cover"
    />
  );
}

const steps = [
  { title: "Votre rendez-vous", text: "Choisissez en ligne un créneau de visite, ou appelez-nous." },
  { title: "Visite et métrage", text: "Nous venons sur place, validons les surfaces et choisissons les finitions avec vous." },
  { title: "Devis détaillé", text: "Un devis clair, signé en ligne, avec une date de pose." },
  { title: "Pose", text: "Une intervention propre et rapide. Vos surfaces sont transformées, sans démolition." },
];

// Rénover ou remplacer : la même question, point par point
const comparison = [
  { label: "Ce que vous payez", replace: "Des éléments neufs, à la place des anciens", refit: "Uniquement l'habillage des surfaces" },
  { label: "Durée", replace: "Une longue immobilisation", refit: "Quelques jours de pose" },
  { label: "Sur place", replace: "Démolition et gravats", refit: "Ni démolition ni gravats" },
  { label: "Déchets", replace: "Les anciens éléments partent à la benne", refit: "L'existant est conservé, moins de transport" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: site.name,
  slogan: site.tagline,
  description: site.description,
  url: site.url,
  ...(hasPhone ? { telephone: site.phone } : {}),
  email: site.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.city,
    postalCode: site.postalCode,
    addressRegion: site.region,
    addressCountry: "FR",
  },
  areaServed: site.areaServed,
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Ouverture : ce que l'on fait, dit en une phrase, sur fond de Saint-Malo vu du ciel */}
      <section className="relative isolate overflow-hidden">
        <Image
          src={saintMalo}
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          className="-z-10 object-cover object-[55%_center]"
        />
        {/* Voiles neutres : texte lisible à gauche, la ville en grand à droite, fondu vers la section suivante */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-ink/90 via-ink/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-linear-to-t from-ink to-transparent" />
        <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-7xl items-center px-4 py-16 sm:px-6">
          <div className="max-w-2xl -translate-y-4">
            <p className="hero-rise kicker">Saint-Malo · Côte d&apos;Émeraude</p>
            <h1 className="hero-rise mt-6 font-display text-4xl font-medium leading-[1.05] tracking-tight text-balance [--rise-delay:60ms] sm:text-6xl">
              Vos surfaces transformées, sans rien remplacer
            </h1>
            <div className="hero-rise [--rise-delay:120ms]">
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/75">
                Nous habillons vos cuisines, meubles et agencements de revêtements adhésifs Cover Styl&apos;, et vos
                vitrages de films Solar Screen. L&apos;aspect du neuf, sans démolition, posé en quelques jours.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href="/rendez-vous">Prendre rendez-vous</ButtonLink>
                <ButtonLink href="#en-video" variant="outline">
                  Voir la pose en vidéo
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Les 4 domaines, en photos, formulés comme le problème du client */}
      <section className="border-t border-line bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <p className="eyebrow">Nos solutions</p>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-tight sm:text-4xl">
            Quelle surface voulez-vous transformer&nbsp;?
          </h2>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {univers.map((u) => (
              <li key={u.slug}>
                <Link
                  href={`/${u.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-ink transition-colors hover:border-paper/30"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <UniversVisual slug={u.slug} />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm text-stone">{u.title}</p>
                    <p className="mt-2 font-display text-lg font-medium leading-snug">{problems[u.slug]}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-paper/65">{u.pitch}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-paper/80 transition-colors group-hover:text-accent">
                      Découvrir {u.name} <ArrowRight className="size-4" strokeWidth={1.5} />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Les finitions Cover Styl' et Solar Screen, juste avant les inspirations */}
      <FinishesSection />

      {/* Inspirations : carrousel flottant */}
      <section className="overflow-hidden border-t border-line py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow">Inspirations</p>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-tight sm:text-4xl">
            Des idées pour votre projet
          </h2>
          <p className="mt-4 max-w-2xl text-paper/65">
            Quelques mises en situation des finitions Cover Styl&apos; et Solar Screen. Faites glisser pour en voir plus.
          </p>
        </div>
        <div className="mt-8">
          <InspirationCarousel />
        </div>
      </section>

      {/* La pose en vidéo */}
      <section id="en-video" className="scroll-mt-24 border-t border-line bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <p className="eyebrow">En vidéo</p>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-tight sm:text-4xl">
            Une pose propre, sans démolition
          </h2>
          <p className="mt-4 max-w-2xl text-paper/65">
            Cuisines, vitrages, murs, mobilier : les étapes de la pose, en accéléré.
          </p>
          <div className="mt-6">
            <VideoCarousel items={videoCarousel} />
          </div>
        </div>
      </section>

      <RecentProjects />

      {/* Pourquoi : remplacer ou habiller, comparé point par point */}
      <section className="bg-paper text-ink">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="font-display text-sm font-medium text-ink/55">Pourquoi rénover plutôt que remplacer</p>
            <h2 className="mt-3 font-display text-2xl font-medium tracking-tight sm:text-4xl">Le neuf, sans le chantier</h2>
            <p className="mt-4 max-w-sm text-ink/65">
              Vos éléments restent en place. Seules leurs surfaces changent.
            </p>
          </div>

          <div role="table" aria-label="Remplacer ou habiller avec REFIT" className="text-sm sm:text-base">
            <div role="row" className="grid grid-cols-2 gap-4 border-b border-ink/10 pb-3 sm:grid-cols-[10rem_1fr_1fr]">
              <span role="columnheader" className="sr-only sm:not-sr-only" />
              <span role="columnheader" className="font-display text-sm font-medium text-ink/50">Remplacer</span>
              <span role="columnheader" className="font-display text-sm font-medium text-accent-strong">
                Habiller avec REFIT
              </span>
            </div>
            {comparison.map((row) => (
              <div
                key={row.label}
                role="row"
                className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-ink/10 py-4 sm:grid-cols-[10rem_1fr_1fr] sm:py-5"
              >
                <span role="rowheader" className="col-span-2 text-sm text-ink/55 sm:col-span-1">
                  {row.label}
                </span>
                <span role="cell" className="text-ink/55 line-through decoration-ink/25">
                  {row.replace}
                </span>
                <span role="cell" className="font-medium text-ink">
                  {row.refit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Méthode */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <p className="eyebrow">Comment ça se passe</p>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-tight sm:text-4xl">De la demande à la pose</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-line pt-6">
                <span className="font-display text-sm font-medium tabular-nums text-stone">0{i + 1}</span>
                <p className="mt-3 font-display text-lg font-medium">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
