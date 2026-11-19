import type { Metadata } from "next";
import { Check } from "lucide-react";
import { CtaBand } from "@/components/site/CtaBand";
import Image from "next/image";
import { VideoReel } from "@/components/site/VideoReel";
import { universPhoto, universVideo } from "@/content/media";
import { RecentProjects } from "@/components/site/RecentProjects";
import { SunToday } from "@/components/site/SunToday";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/content/site";
import { getUnivers, type UniversSlug } from "@/content/univers";

export function universMetadata(slug: UniversSlug): Metadata {
  const u = getUnivers(slug);
  return {
    title: u.seoTitle,
    description: u.seoDescription,
    alternates: { canonical: `/${u.slug}` },
  };
}

export function UniversPage({ slug }: { slug: UniversSlug }) {
  const u = getUnivers(slug);
  const photo = universPhoto[slug];
  const video = universVideo[slug];
  // Données structurées : la prestation, son prestataire et sa zone d'intervention
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${u.name} — ${u.title}`,
    description: u.seoDescription,
    serviceType: u.title,
    provider: { "@type": "HomeAndConstructionBusiness", name: site.name, url: site.url },
    areaServed: site.areaServed,
    url: `${site.url}/${u.slug}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="relative overflow-hidden border-b border-line">
        {photo && (
          <>
            <Image src={photo.src} alt="" fill priority sizes="100vw" placeholder="blur" className="object-cover" />
            {/* Voile neutre : uni sur mobile (le texte couvre toute la largeur), en dégradé ailleurs pour montrer la photo à droite */}
            <div className="absolute inset-0 bg-ink/80 sm:bg-transparent sm:bg-linear-to-r sm:from-ink/95 sm:via-ink/70 sm:to-ink/10" />
          </>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="eyebrow">{u.name}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium tracking-tight sm:text-6xl">{u.title}</h1>
          <p className="mt-6 max-w-2xl font-display text-lg text-paper sm:text-xl">{u.pitch}</p>
          <p className="mt-4 max-w-2xl leading-relaxed text-paper/70">{u.intro}</p>
          <p className="mt-4 text-sm text-paper/55">Pour : {u.forWho}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={`/rendez-vous?univers=${u.slug}`}>Prendre rendez-vous</ButtonLink>
            <ButtonLink href={`/realisations?univers=${u.slug}`} variant="outline">
              Réalisations {u.name}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className={`mx-auto max-w-7xl px-4 py-24 sm:px-6 ${video ? "grid items-start gap-16 lg:grid-cols-[1fr_20rem]" : ""}`}>
        <div>
          <p className="eyebrow">Prestations</p>
          {/* Liste à filets : autant de lignes que de prestations, sans case vide */}
          <ul className="mt-6 border-t border-line">
            {u.services.map((s) => (
              <li key={s.title} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[14rem_1fr] sm:gap-8">
                <p className="font-display text-lg font-medium">{s.title}</p>
                <p className="leading-relaxed text-paper/65">{s.text}</p>
              </li>
            ))}
          </ul>

          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {u.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-paper/85">
                <Check className="mt-0.5 size-5 shrink-0 text-stone" strokeWidth={1.5} aria-hidden />
                {b}
              </li>
            ))}
          </ul>
          {slug === "glass" && <SunToday />}
        </div>
        {video && <VideoReel video={video} className="mx-auto w-full max-w-xs lg:sticky lg:top-24" />}
      </section>

      <RecentProjects univers={slug} />
      <CtaBand />
    </>
  );
}
