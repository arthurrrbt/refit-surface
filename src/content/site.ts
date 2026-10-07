// Coordonnées et informations légales — à valider avant mise en ligne.
export const site = {
  name: "REFIT Surface",
  url: "https://www.refitsurface.fr",
  tagline: "Transformer sans remplacer",
  baseline: "Donner une nouvelle vie à l'existant",
  description:
    "Rénovation de surfaces et de vitrages à Saint-Malo : revêtements adhésifs Cover Styl', films solaires Solar Screen. Cuisines, mobilier, hôtels, restaurants et intérieurs de bateaux.",
  manager: "Arnaud Biet",
  // TODO : remplacer par le vrai numéro (celui de la maquette est fictif)
  phone: "06 12 34 56 78",
  email: "contact@refitsurface.fr",
  city: "Saint-Malo",
  region: "Bretagne",
  postalCode: "35400",
  areaServed: ["Saint-Malo", "Dinard", "Cancale", "Dinan", "Rennes", "Côte d'Émeraude"],
  certifications: ["Poseur certifié Cover Styl'", "Films solaires Solar Screen"],
} as const;

export const phoneHref = `tel:+33${site.phone.replace(/\s/g, "").slice(1)}`;
