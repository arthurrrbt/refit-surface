import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Leaf, PiggyBank } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { MaterialSwatch } from "@/components/site/MaterialSwatch";
import { RecentProjects } from "@/components/site/RecentProjects";
import { CtaBand } from "@/components/site/CtaBand";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/content/site";
import { univers } from "@/content/univers";

const steps = [
  { title: "Votre demande", text: "Quelques photos et dimensions via le formulaire, ou un simple appel." },
  { title: "Visite & métrage", text: "Nous venons sur place, validons les surfaces et choisissons les finitions avec vous." },
  { title: "Devis détaillé", text: "Un devis clair, signé en ligne, avec une date de pose." },
  { title: "Pose", text: "Une intervention propre et rapide. Vos surfaces sont transformées, sans démolition." },
];

const reasons = [
  { icon: PiggyBank, title: "Économique", text: "Une fraction du coût d'un remplacement complet." },
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
  telephone: site.phone,
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:min-h-[78vh] lg:grid-cols-[1.25fr_1fr] lg:py-0">
          <div className="flex flex-col items-start">
            <Logo size="lg" align="start" />
            <span className="accent-rule mt-8" />
            <h1 className="mt-8 font-display text-lg font-normal uppercase tracking-(--tracking-brand) sm:text-xl xl:text-2xl">
              {site.tagline}
            </h1>
            <p className="mt-4 font-display text-xs uppercase tracking-(--tracking-brand) text-paper/70 sm:text-sm">
              {site.baseline}
            </p>
            <p className="mt-8 text-base text-paper/85 sm:text-lg">
              Poseur certifié <strong>Cover Styl&apos;</strong>
              <span className="mx-3 text-accent">•</span>
              Films solaires <strong>Solar Screen</strong>
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/devis">Demander un devis</ButtonLink>
              <ButtonLink href="/realisations" variant="outline">
                Voir les réalisations
              </ButtonLink>
            </div>
          </div>

          <div className="relative hidden h-full min-h-[560px] lg:block">
            <Image
              src="/brand/matieres.png"
              alt="Bois, marbre, béton et vitrage : les matières REFIT Surface"
              fill
              priority
              sizes="40vw"
              className="object-cover object-left"
            />
            <div className="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-ink to-transparent" />
          </div>
        </div>
      </section>

      {/* Univers */}
      <section className="border-t border-line bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="eyebrow">Quatre univers</p>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
            Une même promesse, quatre terrains de jeu
          </h2>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {univers.map((u) => (
              <li key={u.slug}>
                <Link
                  href={`/${u.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-sm border border-line bg-ink transition-colors hover:border-accent"
                >
                  <MaterialSwatch slug={u.slug} className="relative h-40" />
                  <div className="flex flex-1 flex-col p-6">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">
                      {u.name}
                    </p>
                    <p className="mt-1 text-sm text-accent">{u.title}</p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-paper/65">{u.pitch}</p>
                    <span className="mt-6 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] text-paper/80 group-hover:text-accent">
                      Découvrir <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
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
