// Identité légale de l'entreprise — imprimée sur les mentions légales, CGV, devis et factures.
// Chaque valeur entre crochets est À COMPLÉTER après l'immatriculation.
import { site } from "./site";

export const company = {
  name: site.name, // dénomination (société) ou nom commercial (entrepreneur individuel)
  // Micro-entreprise : « Entrepreneur individuel — Arnaud Biet (EI) ».
  // Société : « SASU au capital de X € » (forme + capital social).
  legalForm: "[À COMPLÉTER : forme juridique (et capital social si société)]",
  address: "[À COMPLÉTER : adresse du siège]",
  postalCode: site.postalCode,
  city: site.city,
  siret: "[À COMPLÉTER : SIRET]",
  // Société : « RCS Saint-Malo n° … ». Micro-entreprise : immatriculation au Registre national des entreprises (RNE).
  rcs: "[À COMPLÉTER : RCS + ville (société) ou RNE (entrepreneur individuel)]",
  vatNumber: "[À COMPLÉTER : n° de TVA intracommunautaire]",
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
  // Hébergeurs (LCEN) — À VÉRIFIER sur les sites de Vercel et Supabase avant publication.
  hosting: [
    {
      role: "Hébergement du site",
      name: "Vercel Inc.",
      address: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
      phone: "[À VÉRIFIER : téléphone de l'hébergeur]",
      website: "vercel.com",
    },
    {
      role: "Hébergement des données et des fichiers (serveurs dans l'Union européenne)",
      name: "Supabase Inc.",
      address: "[À VÉRIFIER : adresse de Supabase Inc.]",
      phone: "[À VÉRIFIER : téléphone de l'hébergeur]",
      website: "supabase.com",
    },
  ],
  paymentTerms:
    "Paiement par virement ou chèque. Professionnels : acompte à la signature, solde à la fin des travaux. Particuliers : acompte exigible au plus tôt 7 jours après la signature lorsque le devis est signé hors de nos locaux, solde à la fin des travaux.",
  latePenalty:
    "Retard de paiement : particuliers, intérêts au taux légal après mise en demeure ; professionnels, pénalités au taux BCE majoré de 10 points et indemnité forfaitaire de 40 € pour frais de recouvrement. Pas d'escompte pour paiement anticipé.",
};

export const mediatorText = `${company.mediator.name} — ${company.mediator.address} — ${company.mediator.website}`;
