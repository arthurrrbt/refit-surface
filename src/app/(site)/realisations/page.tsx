import type { Metadata } from "next";
import { Suspense } from "react";
import { CtaBand } from "@/components/site/CtaBand";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { ComingSoon, PageIntro } from "@/components/site/PageIntro";
import { getPublishedProjects } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Réalisations avant / après",
  description: "Découvrez nos réalisations avant / après : cuisines, mobilier, vitrages, hôtels, restaurants et bateaux.",
  alternates: { canonical: "/realisations" },
};

export default function RealisationsPage({ searchParams }: PageProps<"/realisations">) {
  return (
    <>
      <PageIntro eyebrow="Avant / après" title="Nos réalisations">
        Cuisines, mobilier, vitrages, hôtels, restaurants et bateaux : faites glisser le curseur pour voir la
        transformation.
      </PageIntro>
      {/* Le filtre ?univers= est lu à la requête ; la galerie reste rendue côté serveur (SEO) */}
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <Gallery searchParams={searchParams} />
      </Suspense>
      <CtaBand />
    </>
  );
}

async function Gallery({ searchParams }: { searchParams: PageProps<"/realisations">["searchParams"] }) {
  const [projects, params] = await Promise.all([getPublishedProjects(), searchParams]);
  if (!projects.length) return <ComingSoon>La galerie de réalisations est en cours de préparation.</ComingSoon>;
  const initial = typeof params.univers === "string" ? params.univers : undefined;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <GalleryGrid projects={projects} initialFilter={initial} />
    </div>
  );
}
