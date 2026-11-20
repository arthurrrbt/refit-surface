// Identité légale de l'entreprise — imprimée sur les mentions légales, CGV, devis et factures.
// Source : attestation d'immatriculation au Registre national des entreprises (INPI) du 5 novembre 2026.
// Les valeurs encore entre crochets sont À COMPLÉTER (voir pending() ci-dessous).
import { site } from "./site";

export const company = {
  name: site.name, // nom commercial
  // Entrepreneur individuel : la mention « EI » après le nom est obligatoire sur tous les documents (loi du 14 février 2022)
  legalForm: "Arnaud Biet, entrepreneur individuel (EI)",
  address: "2 impasse de la Ville Esse",
  postalCode: site.postalCode,
  city: site.city,
  siren: "848 462 438",
  siret: "848 462 438 00013",
  rcs: "RNE 848 462 438",
  registeredOn: "12 février 2024", // date d'immatriculation au RNE
  apeCode: "4334Z — Travaux de peinture et vitrerie",
  vatNumber: "FR44 848 462 438",
  publicationDirector: site.manager,
  phone: site.phone,
  email: site.email,
  website: "www.refitsurface.fr",
  insurance: "[À COMPLÉTER : assureur, n° de contrat, couverture géographique]",
  mediator: {
    name: "[MÉDIATEUR À CHOISIR]",
    address: "[adresse du médiateur]",
    website: "[site internet du médiateur]",
  },
  iban: "[À COMPLÉTER : IBAN]",
  // Hébergeurs (LCEN). Vérifié le 20/11/2026 sur leurs pages légales (vercel.com/legal/privacy-notice,
  // supabase.com/terms) : aucun des deux ne publie de numéro de téléphone, d'où un e-mail de contact.
  hosting: [
    {
      role: "Hébergement du site",
      name: "Vercel Inc.",
      address: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
      contact: "privacy@vercel.com",
      website: "vercel.com",
    },
    {
      role: "Hébergement des données et des fichiers (serveurs dans l'Union européenne)",
      name: "Supabase Pte. Ltd.",
      address: "65 Chulia Street #38-02/03, OCBC Centre, Singapour 049513",
      contact: "privacy@supabase.com",
      website: "supabase.com",
    },
  ],
  paymentTerms:
    "Paiement par virement ou chèque. Professionnels : acompte à la signature, solde à la fin des travaux. Particuliers : acompte exigible au plus tôt 7 jours après la signature lorsque le devis est signé hors de nos locaux, solde à la fin des travaux.",
  latePenalty:
    "Retard de paiement : particuliers, intérêts au taux légal après mise en demeure ; professionnels, pénalités au taux BCE majoré de 10 points et indemnité forfaitaire de 40 € pour frais de recouvrement. Pas d'escompte pour paiement anticipé.",
};

export const mediatorText = `${company.mediator.name} — ${company.mediator.address} — ${company.mediator.website}`;

/** Vrai tant qu'une valeur n'est pas encore renseignée (texte entre crochets) : on ne l'affiche pas en public. */
export const pending = (value: string) => value.trim().startsWith("[");
