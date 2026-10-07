import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

// TODO : compléter forme juridique, capital, SIRET, RCS et TVA avant mise en ligne.
export default function MentionsLegalesPage() {
  return (
    <>
      <PageIntro eyebrow="Informations légales" title="Mentions légales" />
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-16 text-paper/75 sm:px-6 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-paper">
        <section className="space-y-2">
          <h2>Éditeur</h2>
          <p>{site.name} — [forme juridique, capital]</p>
          <p>SIRET : [à compléter] — RCS : [à compléter] — TVA : [à compléter]</p>
          <p>Siège : [adresse], {site.postalCode} {site.city}</p>
          <p>Directeur de la publication : {site.manager}</p>
          <p>
            Contact : {site.email} — {site.phone}
          </p>
        </section>
        <section className="space-y-2">
          <h2>Hébergement</h2>
          <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com</p>
          <p>Données applicatives : Supabase, hébergement en Union européenne.</p>
        </section>
        <section className="space-y-2">
          <h2>Données personnelles</h2>
          <p>
            Les informations transmises via les formulaires servent uniquement à traiter votre demande (devis,
            rendez-vous) et ne sont jamais revendues. Elles sont conservées au maximum 3 ans après le dernier
            contact. Vous pouvez exercer vos droits d&apos;accès, de rectification et de suppression en écrivant à{" "}
            {site.email}.
          </p>
        </section>
        <section className="space-y-2">
          <h2>Marques</h2>
          <p>Cover Styl&apos; et Solar Screen sont des marques de leurs propriétaires respectifs.</p>
        </section>
      </div>
    </>
  );
}
