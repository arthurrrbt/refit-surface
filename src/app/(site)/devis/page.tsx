import type { Metadata } from "next";
import { ContactOptions } from "@/components/site/ContactOptions";
import { ComingSoon, PageIntro } from "@/components/site/PageIntro";

export const metadata: Metadata = {
  title: "Demande de devis",
  description: "Demandez un devis de rénovation de surfaces ou de pose de films pour vitrages à Saint-Malo.",
  alternates: { canonical: "/devis" },
};

export default function DevisPage() {
  return (
    <>
      <PageIntro eyebrow="Devis gratuit" title="Parlez-nous de votre projet">
        Décrivez les surfaces à rénover, ajoutez quelques photos et les dimensions approximatives : nous
        préparons une première estimation puis venons valider sur place.
      </PageIntro>
      {/* Phase 2 : formulaire intelligent (univers, surfaces, dimensions, photos) */}
      <ComingSoon>Le formulaire de devis en ligne arrive très bientôt. En attendant, contactez-nous directement :</ComingSoon>
      <ContactOptions />
    </>
  );
}
