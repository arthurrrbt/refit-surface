// Informations légales imprimées sur les devis et factures — À COMPLÉTER avant le premier envoi.
// Mentions obligatoires pour un artisan : identité, SIRET, TVA, assurance professionnelle
// (assureur, contrat, couverture géographique) et médiateur de la consommation (clients particuliers).

export const company = {
  name: "REFIT Surface",
  legalForm: "[Forme juridique et capital]",
  address: "[Adresse]",
  postalCode: "35400",
  city: "Saint-Malo",
  siret: "[SIRET]",
  rcs: "[RCS / RM]",
  vatNumber: "[N° TVA intracommunautaire]",
  phone: "06 12 34 56 78",
  email: "contact@refitsurface.fr",
  website: "www.refitsurface.fr",
  insurance: "[Assureur — n° de contrat — couverture : France métropolitaine]",
  mediator: "[Médiateur de la consommation — site internet]",
  iban: "[IBAN pour les virements]",
  paymentTerms: "Acompte à la signature, solde à la fin des travaux. Paiement par virement ou chèque.",
  latePenalty:
    "En cas de retard de paiement : pénalités au taux de 3 fois le taux d'intérêt légal et, pour les professionnels, indemnité forfaitaire de 40 € pour frais de recouvrement.",
} as const;
