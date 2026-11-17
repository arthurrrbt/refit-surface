import type { StaticImageData } from "next/image";
import type { UniversSlug } from "./univers";

// Photos et vidéos du site. Elles font partie du code (dossiers src/assets/media et public/media) :
// elles sont publiées avec le site et ne dépendent d'aucun stockage personnel.
// Les images sont importées statiquement : Next.js connaît leurs dimensions et sert du WebP/AVIF adapté à l'écran.
import cuisineAvant from "@/assets/media/cuisine-avant.jpg";
import cuisineApres from "@/assets/media/cuisine-apres.jpg";
import bateau from "@/assets/media/bateau-avant-apres.jpg";
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

export type Photo = { src: StaticImageData; alt: string };
export type Video = { src: string; poster: string; title: string };

/** Exemple d'avant / après mis en avant dès l'ouverture de la page d'accueil. */
export const heroBeforeAfter = {
  before: cuisineAvant,
  after: cuisineApres,
  alt: "Cuisine rénovée par revêtement adhésif, sans changer les meubles",
};

/** Photo représentative de chaque univers (cartes de l'accueil et en-tête des pages). */
export const universPhoto: Record<UniversSlug, Photo> = {
  home: { src: cuisineNoire, alt: "Cuisine aux façades noires mates et plan de travail clair" },
  glass: { src: vitragePose, alt: "Pose d'un film sur une porte vitrée" },
  pro: { src: restaurant, alt: "Salle de restaurant et bar rénovés" },
  boat: { src: bateau, alt: "Intérieur de voilier avant et après rénovation" },
};

/** Vidéos de pose, au format vertical (téléphone), accélérées et sans son. */
export const videos: Record<"interieur" | "vitrage" | "mobilier", Video> = {
  interieur: {
    src: "/media/videos/pose-film-interieur.mp4",
    poster: "/media/videos/pose-film-interieur.jpg",
    title: "Habillage de menuiseries et de murs par film décoratif",
  },
  vitrage: {
    src: "/media/videos/pose-film-vitrage.mp4",
    poster: "/media/videos/pose-film-vitrage.jpg",
    title: "Pose d'un film solaire sur une porte vitrée",
  },
  mobilier: {
    src: "/media/videos/pose-film-mobilier.mp4",
    poster: "/media/videos/pose-film-mobilier.jpg",
    title: "Tables de restaurant habillées d'un film effet marbre",
  },
};

/** Vidéo montrée sur la page de chaque univers (aucune pour l'instant pour Boat). */
export const universVideo: Partial<Record<UniversSlug, Video>> = {
  home: videos.interieur,
  glass: videos.vitrage,
  pro: videos.mobilier,
};

/** Carrousel d'inspirations : visuels des fabricants, présentés comme idées de finitions (pas comme nos chantiers). */
export const inspirations: (Photo & { label: string; univers: UniversSlug })[] = [
  { src: cuisineBois3, alt: "Cuisine blanche et bois avec crédence effet bois", label: "Bois & blanc", univers: "home" },
  { src: cuisineNoire, alt: "Cuisine noire mate et plan de travail clair", label: "Noir mat", univers: "home" },
  { src: filmsSilver, alt: "Trois teintes de films solaires argentés sur vitrage", label: "Films solaires", univers: "glass" },
  { src: cuisineBois1, alt: "Façades et plan de travail effet bois", label: "Bois en duo", univers: "home" },
  { src: restaurant, alt: "Salle de restaurant et comptoir de bar", label: "Restaurant", univers: "pro" },
  { src: cuisineNoireColonnes, alt: "Colonnes de cuisine noires avec fours encastrés", label: "Colonnes noires", univers: "home" },
  { src: cuisineBois2, alt: "Plan de travail effet bois texturé", label: "Plan de travail", univers: "home" },
  { src: vitragePose, alt: "Pose d'un film sur une porte vitrée", label: "Vitrages", univers: "glass" },
  { src: cuisineBlanche, alt: "Cuisine blanche lumineuse", label: "Blanc lumineux", univers: "home" },
  { src: cuisineBois4, alt: "Cuisine blanche, bois et crédence assortie", label: "Crédence", univers: "home" },
  { src: bateau, alt: "Carré de voilier rénové", label: "Bateau", univers: "boat" },
];
