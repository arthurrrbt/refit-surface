import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactOptions } from "@/components/site/ContactOptions";
import { PageIntro } from "@/components/site/PageIntro";
import { DevisForm } from "./DevisForm";

// Laisse le temps à l'agent Qualification (lancé après la réponse via after())
export const maxDuration = 60;

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
      {/* useSearchParams (?univers=) → limite de Suspense requise */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <DevisForm />
      </Suspense>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 pt-12 font-display text-lg font-semibold sm:px-6">Vous préférez appeler ?</p>
        <ContactOptions />
      </div>
    </>
  );
}
