import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { company } from "@/content/company";
import { hasPhone, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Mentions légales du site ${site.name} : éditeur, directeur de la publication, hébergeurs.`,
  alternates: { canonical: "/mentions-legales" },
};

// Article 6 III de la loi n° 2004-575 du 21 juin 2004 (LCEN). Les valeurs entre crochets
// viennent de src/content/company.ts et doivent être complétées après immatriculation.
export default function MentionsLegalesPage() {
  return (
    <LegalPage eyebrow="Informations légales" title="Mentions légales" updated="7 octobre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <ul>
          <li>Nom commercial / dénomination : {company.name}</li>
          <li>Forme juridique : {company.legalForm}</li>
          <li>
            Siège : {company.address}, {company.postalCode} {company.city}
          </li>
          <li>SIRET : {company.siret}</li>
          <li>Immatriculation : {company.rcs}</li>
          <li>TVA intracommunautaire : {company.vatNumber}</li>
          <li>
            E-mail : <a href={`mailto:${company.email}`}>{company.email}</a>
          </li>
          {hasPhone && <li>Téléphone : {company.phone}</li>}
        </ul>
        <p>Directeur de la publication : {company.publicationDirector}.</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        {company.hosting.map((h) => (
          <div key={h.name}>
            <h3>{h.role}</h3>
            <p>
              {h.name} — {h.address} — téléphone : {h.phone} — {h.website}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2>Assurance professionnelle</h2>
        <p>{company.insurance}</p>
      </section>

      <section>
        <h2>Médiation de la consommation</h2>
        <p>
          En cas de litige non résolu avec nous, un client particulier peut recourir gratuitement au médiateur de la consommation :{" "}
          {company.mediator.name} — {company.mediator.address} — {company.mediator.website}. Voir aussi nos{" "}
          <Link href="/cgv#mediation">conditions générales</Link>.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Les textes, photographies de réalisations, logo et éléments graphiques de ce site appartiennent à {company.name} ou sont
          utilisés avec l&apos;autorisation de leurs titulaires. Toute reproduction sans autorisation est interdite.
        </p>
        <p>
          Cover Styl&apos; et Solar Screen sont des marques de leurs propriétaires respectifs ; elles sont citées pour désigner les produits
          posés par {company.name}.
        </p>
      </section>

      <section>
        <h2>Données personnelles et cookies</h2>
        <p>
          Voir la <Link href="/confidentialite">politique de confidentialité</Link>. Ce site ne dépose aucun cookie publicitaire ni de mesure
          d&apos;audience (<Link href="/confidentialite#cookies">détail</Link>).
        </p>
      </section>
    </LegalPage>
  );
}
