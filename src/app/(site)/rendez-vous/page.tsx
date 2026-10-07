import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactOptions } from "@/components/site/ContactOptions";
import { PageIntro } from "@/components/site/PageIntro";
import { getAvailableSlots } from "@/lib/booking/slots";
import { BookingForm } from "./BookingForm";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description: "Réservez en ligne une visite et un métrage à domicile ou sur site à Saint-Malo et sur la Côte d'Émeraude.",
  alternates: { canonical: "/rendez-vous" },
};

export default function RendezVousPage() {
  return (
    <>
      <PageIntro eyebrow="Visite & métrage" title="Prendre rendez-vous">
        Nous venons voir vos surfaces, prenons les mesures et vous présentons les échantillons de finitions.
        Choisissez le créneau qui vous convient.
      </PageIntro>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Créneaux calculés à la requête (heure courante + planning) */}
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          <Slots />
        </Suspense>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 pt-12 font-display text-lg font-semibold sm:px-6">Vous préférez appeler ?</p>
        <ContactOptions />
      </div>
    </>
  );
}

async function Slots() {
  const days = await getAvailableSlots();
  return <BookingForm days={days} />;
}
