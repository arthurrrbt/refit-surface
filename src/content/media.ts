import type { StaticImageData } from "next/image";
import type { UniversSlug } from "./univers";

// Photos et vidéos du site. Elles font partie du code (dossiers src/assets/media et public/media) :
// elles sont publiées avec le site et ne dépendent d'aucun stockage personnel.
// Les images sont importées statiquement : Next.js connaît leurs dimensions et sert du WebP/AVIF adapté à l'écran.
import restaurant from "@/assets/media/restaurant.jpg";
import cuisineBlanche from "@/assets/media/cuisine-blanche.jpg";
import cuisineNoire from "@/assets/media/cuisine-noire.jpg";
import cuisineNoireColonnes from "@/assets/media/cuisine-noire-colonnes.jpg";
import vitragePose from "@/assets/media/vitrage-pose.jpg";
import filmsSilver from "@/assets/media/films-silver.jpg";
import cuisineBois1 from "@/assets/media/cuisine-bois-1.jpg";
import cuisineBois2 from "@/assets/media/cuisine-bois-2.jpg";
import cuisineBois3 from "@/assets/media/cuisine-bois-3.jpg";
import cuisineBois4 from "@/assets/media/cuisine-bois-4.jpg";
import verreTeinte from "@/assets/media/verre-teinte.jpg";
import miroirBuffet from "@/assets/media/miroir-buffet.jpg";
import miroirAscenseurs from "@/assets/media/miroir-ascenseurs.jpg";
import comptoirDore from "@/assets/media/comptoir-dore.jpg";
import hotelCouloir from "@/assets/media/hotel-couloir.jpg";

/** Fond de l'ouverture de l'accueil : Saint-Malo intra-muros vu du ciel. */
export { default as saintMalo } from "@/assets/media/saint-malo.jpg";

export type Photo = { src: StaticImageData; alt: string };
export type Video = { src: string; poster: string; title: string };

/** Photo phare de l'ouverture de la page d'accueil, à côté de la vidéo de pose. */
export const heroPhoto: Photo = {
  src: cuisineNoire,
  alt: "Cuisine aux façades noires mates et plan de travail clair",
};

/** Photo représentative de chaque univers (cartes de l'accueil et en-tête des pages). Boat : photos à venir. */
export const universPhoto: Partial<Record<UniversSlug, Photo>> = {
  home: { src: cuisineBois4, alt: "Cuisine blanche, crédence et plan de travail effet bois" },
  glass: { src: vitragePose, alt: "Pose d'un film sur une porte vitrée" },
  pro: { src: restaurant, alt: "Salle de restaurant et bar rénovés" },
};

const video = (name: string, title: string): Video => ({
  src: `/media/videos/${name}.mp4`,
  poster: `/media/videos/${name}.jpg`,
  title,
});

/** Vidéos de pose, au format vertical (téléphone), accélérées et sans son. */
export const videos = {
  cuisine: video("pose-cuisine-noir-mat", "Cuisine habillée en noir mat, sans changer les meubles"),
  vitrage: video("pose-film-vitrage", "Pose d'un film solaire sur une porte vitrée"),
  mural: video("pose-revetement-mural", "Revêtement mural posé en une journée"),
  mobilier: video("pose-film-mobilier", "Tables de restaurant habillées d'un film effet marbre"),
  panneau: video("pose-panneau-texture", "Panneau décoratif habillé d'un film texturé"),
  interieur: video("pose-film-interieur", "Habillage de menuiseries et de murs par film décoratif"),
} satisfies Record<string, Video>;

/** Ordre du carrousel « La pose en vidéo » : on alterne cuisine, vitrage, murs, professionnels. */
export const videoCarousel: Video[] = [videos.cuisine, videos.vitrage, videos.mural, videos.mobilier, videos.panneau, videos.interieur];

/** Vidéo montrée sur la page de chaque univers (aucune pour l'instant pour Boat). */
export const universVideo: Partial<Record<UniversSlug, Video>> = {
  home: videos.cuisine,
  glass: videos.vitrage,
  pro: videos.mobilier,
};

/** Carrousel d'inspirations : visuels des fabricants, présentés comme idées de finitions (pas comme nos chantiers). */
export const inspirations: (Photo & { label: string; univers: UniversSlug })[] = [
  { src: cuisineBois3, alt: "Gros plan d'un plan de travail effet bois texturé", label: "Bois texturé", univers: "home" },
  { src: verreTeinte, alt: "Cloison vitrée teintée ambre dans un salon", label: "Verre teinté", univers: "glass" },
  { src: cuisineNoire, alt: "Cuisine noire mate et plan de travail clair", label: "Noir mat", univers: "home" },
  { src: comptoirDore, alt: "Comptoir d'accueil habillé d'un film doré", label: "Comptoir doré", univers: "pro" },
  { src: miroirBuffet, alt: "Buffet habillé d'un film effet miroir argenté", label: "Effet miroir", univers: "home" },
  { src: filmsSilver, alt: "Trois teintes de films solaires argentés sur vitrage", label: "Films solaires", univers: "glass" },
  { src: hotelCouloir, alt: "Couloir d'hôtel aux portes et habillages effet bois", label: "Hôtel", univers: "pro" },
  { src: cuisineBois1, alt: "Cuisine blanche avec îlot et plans effet bois", label: "Bois en duo", univers: "home" },
  { src: miroirAscenseurs, alt: "Portes d'ascenseur habillées d'un film argent miroir", label: "Hall & ascenseurs", univers: "pro" },
  { src: cuisineNoireColonnes, alt: "Colonnes de cuisine noires avec fours encastrés", label: "Colonnes noires", univers: "home" },
  { src: restaurant, alt: "Salle de restaurant et comptoir de bar", label: "Restaurant", univers: "pro" },
  { src: cuisineBois2, alt: "Crédence et plan de travail effet bois autour d'une plaque de cuisson", label: "Plan de travail", univers: "home" },
  { src: vitragePose, alt: "Pose d'un film sur une porte vitrée", label: "Vitrages", univers: "glass" },
  { src: cuisineBlanche, alt: "Cuisine blanche lumineuse", label: "Blanc lumineux", univers: "home" },
  { src: cuisineBois4, alt: "Cuisine blanche, crédence et plan de travail effet bois", label: "Bois & blanc", univers: "home" },
];
