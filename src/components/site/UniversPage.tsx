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
          <Image src={photo.src} alt="" fill priority sizes="100vw" placeholder="blur" className="object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-ink/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="eyebrow">{u.name}</p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold sm:text-5xl">{u.title}</h1>
          <span className="accent-rule mt-6" />
          <p className="mt-6 max-w-2xl font-display text-lg text-paper/90 sm:text-xl">{u.pitch}</p>
          <p className="mt-6 max-w-2xl leading-relaxed text-paper/70">{u.intro}</p>
          <p className="mt-6 text-sm text-paper/50">Pour : {u.forWho}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={`/rendez-vous?univers=${u.slug}`}>Prendre rendez-vous</ButtonLink>
            <ButtonLink href={`/realisations?univers=${u.slug}`} variant="outline">
              Réalisations {u.name}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className={`mx-auto max-w-7xl px-4 py-20 sm:px-6 ${video ? "grid items-start gap-12 lg:grid-cols-[1fr_20rem]" : ""}`}>
        <div>
          <p className="eyebrow">Prestations</p>
          <ul className={`mt-8 grid gap-5 ${video ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {u.services.map((s) => (
              <li key={s.title} className="rounded-sm border border-line bg-ink-2 p-6">
                <p className="font-display font-semibold">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{s.text}</p>
              </li>
            ))}
          </ul>

          <ul className="mt-14 grid gap-4 sm:grid-cols-3">
            {u.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-paper/85">
                <Check className="mt-0.5 size-5 shrink-0 text-accent" />
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
