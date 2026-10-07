// Informations publiques du site. Source unique des coordonnées : reprises par les mentions
// légales, les CGV, la politique de confidentialité, les devis, les factures et le pied de page.
export const site = {
  name: "REFIT Surface",
  url: "https://www.refitsurface.fr",
  tagline: "Transformer sans remplacer",
  baseline: "Donner une nouvelle vie à l'existant",
  description:
    "Rénovation de surfaces et de vitrages à Saint-Malo : revêtements adhésifs Cover Styl', films solaires Solar Screen. Cuisines, mobilier, hôtels, restaurants et intérieurs de bateaux.",
  manager: "Arnaud Biet",
  // À COMPLÉTER : vrai numéro. Vide = le téléphone n'est affiché nulle part (l'ancien numéro était fictif).
  phone: "",
  // À VÉRIFIER : l'adresse doit exister (nom de domaine refitsurface.fr à acheter et boîte mail à créer).
  email: "contact@refitsurface.fr",
  city: "Saint-Malo",
  region: "Bretagne",
  postalCode: "35400",
  areaServed: ["Saint-Malo", "Dinard", "Cancale", "Dinan", "Rennes", "Côte d'Émeraude"],
  // À VÉRIFIER : n'afficher une certification que si elle est réelle et en cours de validité.
  certifications: ["Poseur certifié Cover Styl'", "Films solaires Solar Screen"],
  // Liens simples vers vos réseaux (aucun traceur) : ajoutez-les ici, ex. { label: "Instagram", url: "https://…" }.
  social: [] as { label: string; url: string }[],
  /**
   * Tant que l'entreprise n'est pas immatriculée et les mentions complétées, le site reste
   * hors des moteurs de recherche et des agents IA (robots.txt + balise noindex).
   * Passez à true au lancement.
   */
  launched: false,
};

export const hasPhone = /\d{6,}/.test(site.phone.replace(/\s/g, ""));
export const phoneHref = hasPhone ? `tel:+33${site.phone.replace(/\s/g, "").slice(1)}` : "";
