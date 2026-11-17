import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Leaf, PiggyBank, Sailboat } from "lucide-react";
import { HeroPaths } from "@/components/site/HeroPaths";
import { InspirationCarousel } from "@/components/site/InspirationCarousel";
import { RecentProjects } from "@/components/site/RecentProjects";
import { CtaBand } from "@/components/site/CtaBand";
import { VideoReel } from "@/components/site/VideoReel";
import { ButtonLink } from "@/components/ui/Button";
import { heroPhoto, universPhoto, videos } from "@/content/media";
import { hasPhone, site } from "@/content/site";
import { univers, type UniversSlug } from "@/content/univers";

// Chaque domaine présenté par la question que se pose le client
const problems: Record<UniversSlug, string> = {
  home: "Cuisine ou meubles datés ?",
  glass: "Trop de chaleur ou de vis-à-vis ?",
  pro: "Un établissement à rafraîchir ?",
  boat: "Un intérieur de bateau fatigué ?",
};

/** Photo de la carte, ou un visuel neutre tant que l'univers n'a pas encore de photo (Boat). */
function UniversVisual({ slug }: { slug: UniversSlug }) {
  const photo = universPhoto[slug];
  if (!photo) {
    return (
      <div className="flex size-full items-center justify-center bg-linear-to-br from-ink-3 to-ink" aria-hidden>
        <Sailboat className="size-14 text-accent/70 transition-transform duration-700 group-hover:scale-110" strokeWidth={1.2} />
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
      className="object-cover transition-[scale] duration-700 group-hover:scale-105"
    />
  );
}

const steps = [
  { title: "Votre rendez-vous", text: "Choisissez en ligne un créneau de visite, ou appelez-nous." },
  { title: "Visite & métrage", text: "Nous venons sur place, validons les surfaces et choisissons les finitions avec vous." },
  { title: "Devis détaillé", text: "Un devis clair, signé en ligne, avec une date de pose." },
  { title: "Pose", text: "Une intervention propre et rapide. Vos surfaces sont transformées, sans démolition." },
];

const reasons = [
  { icon: PiggyBank, title: "Économique", text: "Vous ne payez que l'habillage des surfaces, pas le remplacement des éléments." },
  { icon: Clock, title: "Rapide", text: "Quelques jours de pose, sans gravats ni longue immobilisation." },
  { icon: Leaf, title: "Responsable", text: "On garde l'existant : moins de déchets, moins de transport." },
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

      {/* Ouverture : ce que l'on fait, dit en une phrase, et montré par un avant / après manipulable */}
      <section className="relative isolate overflow-hidden">
        <HeroPaths />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-ink/40" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1fr_1.05fr] lg:py-16">
          <div>
            <p className="hero-rise eyebrow">Saint-Malo · Côte d&apos;Émeraude</p>
            <h1 className="hero-rise mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance [--rise-delay:80ms] sm:text-6xl">
              Vos surfaces transformées, <span className="text-accent">sans rien remplacer</span>
            </h1>
            <div className="hero-rise [--rise-delay:300ms]">
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/80">
                Nous habillons vos <strong className="text-paper">cuisines, meubles et agencements</strong> de revêtements
                adhésifs Cover Styl&apos;, et vos <strong className="text-paper">vitrages</strong> de films Solar Screen.
                L&apos;aspect du neuf, sans démolition, posé en quelques jours.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Nos domaines">
                {univers.map((u) => (
                  <li key={u.slug}>
                    <Link
                      href={`/${u.slug}`}
                      className="inline-flex rounded-full border border-paper/20 px-3.5 py-1.5 text-sm text-paper/85 transition-colors hover:border-accent hover:text-accent"
                    >
                      {u.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/rendez-vous">Prendre rendez-vous</ButtonLink>
                <ButtonLink href="#en-video" variant="outline">
                  Voir la pose en vidéo
                </ButtonLink>
              </div>
            </div>
          </div>
          {/* Le résultat (photo) et le geste (vidéo de pose) côte à côte */}
          <div className="hero-rise grid grid-cols-[1.15fr_1fr] items-end gap-4 [--rise-delay:200ms] sm:gap-5">
            <figure className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
              <Image
                src={heroPhoto.src}
                alt={heroPhoto.alt}
                fill
                priority
                sizes="(min-width: 1024px) 30vw, 55vw"
                placeholder="blur"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/90 to-transparent p-4 text-sm text-paper">
                Façades noir mat, plan de travail clair
              </figcaption>
            </figure>
            <VideoReel video={videos.interieur} className="border border-line shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]" />
          </div>
        </div>
      </section>

      {/* Les 4 domaines, en photos, formulés comme le problème du client */}
      <section className="border-t border-line bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="eyebrow">Nos solutions</p>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-4xl">Quelle surface voulez-vous transformer ?</h2>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {univers.map((u) => (
              <li key={u.slug}>
                <Link
                  href={`/${u.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-ink transition-colors hover:border-accent"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <UniversVisual slug={u.slug} />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">{u.title}</p>
                    <p className="mt-2 font-display text-lg font-semibold leading-snug">{problems[u.slug]}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-paper/65">{u.pitch}</p>
                    <span className="mt-6 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] text-paper/80 group-hover:text-accent">
                      {u.name} <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Inspirations : carrousel flottant */}
      <section className="overflow-hidden border-t border-line py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow">Inspirations</p>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-4xl">Bois, noir mat, marbre, films solaires…</h2>
          <p className="mt-4 max-w-2xl text-paper/65">
            Des centaines de finitions Cover Styl&apos; et Solar Screen. Nous les choisissons avec vous, sur place, avec les
            échantillons.
          </p>
        </div>
        <div className="mt-8">
          <InspirationCarousel />
        </div>
      </section>

      {/* La pose en vidéo */}
      <section id="en-video" className="scroll-mt-20 border-t border-line bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="eyebrow">En vidéo</p>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-4xl">Une pose propre, sans démolition</h2>
          <ul className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
            {[videos.interieur, videos.vitrage, videos.mobilier].map((v) => (
              <li key={v.src} className="w-[72vw] max-w-xs shrink-0 snap-center md:w-auto md:max-w-none">
                <VideoReel video={v} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RecentProjects />

      {/* Pourquoi */}
      <section className="bg-paper text-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="eyebrow">Pourquoi rénover plutôt que remplacer</p>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Le neuf, sans le chantier</h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-3">
            {reasons.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="size-7 text-accent-strong" strokeWidth={1.5} />
                <p className="mt-4 font-display text-lg font-semibold">{title}</p>
                <p className="mt-2 text-ink/70">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Méthode */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="eyebrow">Comment ça se passe</p>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">De la demande à la pose</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-line pt-6">
                <span className="font-display text-3xl font-extrabold text-accent">0{i + 1}</span>
                <p className="mt-3 font-display font-semibold">{s.title}</p>
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
