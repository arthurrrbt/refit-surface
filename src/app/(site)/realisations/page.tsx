import type { Metadata } from "next";
import { CtaBand } from "@/components/site/CtaBand";
import { ComingSoon, PageIntro } from "@/components/site/PageIntro";

export const metadata: Metadata = {
  title: "Réalisations avant / après",
  description: "Découvrez nos réalisations avant / après : cuisines, mobilier, vitrages, hôtels, restaurants et bateaux.",
  alternates: { canonical: "/realisations" },
};

export default function RealisationsPage() {
  return (
    <>
      <PageIntro eyebrow="Avant / après" title="Nos réalisations">
        Cuisines, mobilier, vitrages, hôtels, restaurants et bateaux : la preuve par l&apos;image.
      </PageIntro>
      {/* Phase 2 : galerie filtrable alimentée par la table gallery_projects */}
      <ComingSoon>La galerie de réalisations est en cours de préparation.</ComingSoon>
      <CtaBand />
    </>
  );
}
