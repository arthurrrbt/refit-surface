import type { Metadata } from "next";
import { ContactOptions } from "@/components/site/ContactOptions";
import { ComingSoon, PageIntro } from "@/components/site/PageIntro";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description: "Réservez une visite et un métrage à domicile ou sur site à Saint-Malo et sur la Côte d'Émeraude.",
  alternates: { canonical: "/rendez-vous" },
};

export default function RendezVousPage() {
  return (
    <>
      <PageIntro eyebrow="Visite & métrage" title="Prendre rendez-vous">
        Nous venons voir vos surfaces, prenons les mesures et vous présentons les échantillons de finitions.
      </PageIntro>
      {/* Phase 2 : réservation en ligne synchronisée avec l'agenda Outlook */}
      <ComingSoon>La réservation en ligne arrive très bientôt. En attendant, contactez-nous directement :</ComingSoon>
      <ContactOptions />
    </>
  );
}
