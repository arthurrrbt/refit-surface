export type UniversSlug = "home" | "glass" | "pro" | "boat";

export type Univers = {
  slug: UniversSlug;
  name: string;
  title: string;
  pitch: string;
  intro: string;
  forWho: string;
  services: { title: string; text: string }[];
  benefits: string[];
  seoTitle: string;
  seoDescription: string;
};

export const univers: Univers[] = [
  {
    slug: "home",
    name: "REFIT Home",
    title: "Cuisine & mobilier",
    pitch: "Une cuisine neuve sans changer de cuisine.",
    intro:
      "Façades, plans de travail, crédences, portes, placards, salle de bain : nous habillons vos surfaces existantes de revêtements adhésifs Cover Styl'. Bois, marbre, béton, métal, unis mats ou brillants — des centaines de finitions, posées en quelques jours, sans démolition.",
    forWho: "Particuliers, propriétaires bailleurs, locations saisonnières",
    services: [
      { title: "Cuisine", text: "Façades, caissons, plans de travail, crédences, électroménager." },
      { title: "Mobilier & menuiseries", text: "Portes, placards, dressings, escaliers, meubles anciens." },
      { title: "Salle de bain", text: "Meubles vasques, habillages, portes et rangements." },
    ],
    benefits: [
      "Sans dépose ni remplacement des éléments existants",
      "Pose en quelques jours, sans gravats",
      "Moins de déchets : on garde l'existant",
    ],
    seoTitle: "Rénovation de cuisine et mobilier sans travaux à Saint-Malo",
    seoDescription:
      "Rénovez votre cuisine et vos meubles sans les remplacer : revêtements adhésifs Cover Styl' posés par un poseur certifié à Saint-Malo et sur la Côte d'Émeraude.",
  },
  {
    slug: "glass",
    name: "REFIT Glass",
    title: "Films pour vitrages",
    pitch: "Moins de chaleur, plus d'intimité, plus de sécurité.",
    intro:
      "Films solaires Solar Screen posés sur vos vitrages existants : baies vitrées, vérandas, vitrines, bureaux. Ils réduisent la chaleur et l'éblouissement, préservent l'intimité ou renforcent la sécurité, sans changer une seule fenêtre.",
    forWho: "Maisons, vérandas, bureaux, commerces",
    services: [
      { title: "Anti-chaleur & anti-UV", text: "Confort d'été, protection du mobilier contre la décoloration." },
      { title: "Intimité & décoration", text: "Films dépolis, occultants, sablés ou décoratifs." },
      { title: "Sécurité", text: "Films de sécurité (anti-éclats, retardateurs d'effraction selon la référence choisie)." },
    ],
    benefits: [
      "Aide à limiter la chaleur due au soleil à travers les vitrages",
      "Pose rapide, sans dépose des vitrages",
      "Solution réversible",
    ],
    seoTitle: "Films solaires, occultants et de sécurité pour vitrages à Saint-Malo",
    seoDescription:
      "Pose de films solaires Solar Screen à Saint-Malo : anti-chaleur, anti-éblouissement, intimité et sécurité pour maisons, vérandas, bureaux et commerces.",
  },
  {
    slug: "pro",
    name: "REFIT Pro",
    title: "Hôtels, restaurants & commerces",
    pitch: "Rénover en limitant l'impact sur votre activité.",
    intro:
      "Chambres d'hôtel, salles de restaurant, comptoirs, bureaux, boutiques : nous rénovons vos espaces professionnels par l'habillage des surfaces, avec des interventions planifiées pour limiter au maximum l'impact sur votre activité.",
    forWho: "Hôtellerie, restauration, commerces, bureaux, architectes",
    services: [
      { title: "Hôtellerie", text: "Portes, têtes de lit, mobilier de chambre, réception." },
      { title: "Restauration", text: "Comptoirs, bars, tables, habillages muraux." },
      { title: "Commerces & bureaux", text: "Agencements, vitrines, cloisons vitrées, signalétique." },
    ],
    benefits: [
      "Interventions hors saison ou en horaires décalés",
      "Rénovation chambre par chambre",
      "Interlocuteur unique, de l'étude à la pose",
    ],
    seoTitle: "Rénovation d'hôtels, restaurants et commerces — Saint-Malo",
    seoDescription:
      "Rénovation de surfaces pour hôtels, restaurants et commerces à Saint-Malo : revêtements adhésifs et films vitrages, interventions planifiées pour limiter la gêne pour votre activité.",
  },
  {
    slug: "boat",
    name: "REFIT Boat",
    title: "Intérieurs de bateaux",
    pitch: "Un carré refait à neuf, sans alourdir le bateau.",
    intro:
      "Carré, cabines, cuisine, boiseries, hublots : nous rénovons l'intérieur de votre bateau avec des revêtements légers et résistants, adaptés aux espaces contraints et à l'environnement marin. Intervention au port de Saint-Malo et alentours.",
    forWho: "Propriétaires, loueurs, brokers, chantiers nautiques",
    services: [
      { title: "Carré & cabines", text: "Boiseries, portes, placards, tables à cartes." },
      { title: "Cuisine de bord", text: "Plans de travail, façades, habillages." },
      { title: "Hublots & vitrages", text: "Films solaires et d'intimité." },
    ],
    benefits: [
      "Matériaux légers et faciles d'entretien",
      "Valorisation avant revente ou location",
      "Intervention à quai",
    ],
    seoTitle: "Rénovation intérieure de bateaux à Saint-Malo",
    seoDescription:
      "Rénovation d'intérieurs de bateaux à Saint-Malo : boiseries, carré, cabines et cuisine habillés de revêtements adhésifs légers et résistants.",
  },
];

export function getUnivers(slug: UniversSlug): Univers {
  const u = univers.find((item) => item.slug === slug);
  if (!u) throw new Error(`Univers inconnu : ${slug}`);
  return u;
}
