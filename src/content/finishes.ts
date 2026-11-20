import type { StaticImageData } from "next/image";

// Finitions présentées sur l'accueil (section « Les finitions »), avant le carrousel d'inspirations.
// Visuels des fabricants (sites Cover Styl' et Solar Screen), utilisés avec l'accord du gérant, poseur certifié.
// Les nombres de références sont ceux des gammes des fabricants (relevés le 20/11/2026).
import bois from "@/assets/media/finitions/cs-bois.jpg";
import couleur from "@/assets/media/finitions/cs-couleur.jpg";
import pierre from "@/assets/media/finitions/cs-pierre.jpg";
import textile from "@/assets/media/finitions/cs-textile.jpg";
import metal from "@/assets/media/finitions/cs-metal.jpg";
import paillettes from "@/assets/media/finitions/cs-paillettes.jpg";
import organique from "@/assets/media/finitions/cs-organique.jpg";
import verreDepoli from "@/assets/media/finitions/cs-verre-depoli.jpg";
import verreLignes from "@/assets/media/finitions/cs-verre-lignes.jpg";
import verreMotifs from "@/assets/media/finitions/cs-verre-motifs.jpg";
import argent from "@/assets/media/finitions/ss-argent.jpg";
import transparent from "@/assets/media/finitions/ss-transparent.jpg";
import neutre from "@/assets/media/finitions/ss-neutre.jpg";
import miroir from "@/assets/media/finitions/ss-miroir-sans-tain.jpg";
import couleursSolaires from "@/assets/media/finitions/ss-couleurs.jpg";
import antiDecoloration from "@/assets/media/finitions/ss-anti-decoloration.jpg";
import securite from "@/assets/media/finitions/ss-securite.jpg";

export type Finish = {
  name: string;
  text: string;
  /** Nombre de références de la famille chez le fabricant (affiché « 182 références ») */
  count?: number;
  src: StaticImageData;
  alt: string;
  href: "/home" | "/glass";
};

export type FinishGroup = {
  key: string;
  brand: string;
  title: string;
  text: string;
  link: { href: "/home" | "/glass"; label: string };
  items: Finish[];
};

export const finishGroups: FinishGroup[] = [
  {
    key: "cover-styl",
    brand: "Cover Styl'",
    title: "Pour vos meubles, cuisines et surfaces",
    text: "Des revêtements adhésifs posés sur l'existant : façades de cuisine, plans de travail, portes, murs, comptoirs, intérieurs de bateaux.",
    link: { href: "/home", label: "Découvrir REFIT Home" },
    items: [
      { name: "Bois", text: "Chêne, noyer, teck : des grains naturels", count: 182, src: bois, alt: "Salon aux murs habillés d'un revêtement effet bois foncé", href: "/home" },
      { name: "Couleurs unies", text: "Teintes unies et finitions mates", count: 111, src: couleur, alt: "Mur habillé d'un revêtement uni terracotta mat", href: "/home" },
      { name: "Pierre et marbre", text: "Marbre, ardoise, finitions minérales", count: 55, src: pierre, alt: "Salle de bain aux murs effet marbre clair", href: "/home" },
      { name: "Textile et cuir", text: "Tissus tissés et cuirs", count: 48, src: textile, alt: "Tête de lit et mur habillés d'un revêtement effet tissu", href: "/home" },
      { name: "Métal", text: "Acier brossé et oxydé", count: 33, src: metal, alt: "Salon aux murs courbes effet acier brossé", href: "/home" },
      { name: "Paillettes", text: "Effets pailletés et chatoyants", count: 13, src: paillettes, alt: "Comptoir d'accueil habillé d'un revêtement pailleté", href: "/home" },
      { name: "Organique", text: "Liège et matières naturelles", count: 12, src: organique, alt: "Mur habillé d'un revêtement effet liège", href: "/home" },
      { name: "Verre dépoli", text: "L'intimité sans perdre la lumière", count: 13, src: verreDepoli, alt: "Cloison vitrée habillée d'un film dépoli", href: "/glass" },
      { name: "Verre cannelé", text: "Effet strié, lumière diffuse", count: 18, src: verreLignes, alt: "Paroi vitrée courbe habillée d'un film à lignes verticales", href: "/glass" },
      { name: "Motifs sur verre", text: "Décors pour portes et cloisons vitrées", count: 15, src: verreMotifs, alt: "Portes vitrées habillées d'un film à motifs", href: "/glass" },
    ],
  },
  {
    key: "solar-screen",
    brand: "Solar Screen",
    title: "Pour vos vitrages",
    text: "Des films posés sur vos vitres, sans les changer : moins de chaleur et d'éblouissement, plus d'intimité, plus de sécurité.",
    link: { href: "/glass", label: "Découvrir REFIT Glass" },
    items: [
      { name: "Argent", text: "Anti-chaleur, effet miroir côté extérieur", count: 22, src: argent, alt: "Façade vitrée réfléchissante d'immeuble de bureaux", href: "/glass" },
      { name: "Transparent", text: "Anti-chaleur quasi invisible", count: 7, src: transparent, alt: "Façade vitrée claire derrière un arbre", href: "/glass" },
      { name: "Neutre", text: "Teinte discrète, éblouissement réduit", count: 9, src: neutre, alt: "Façade d'immeuble aux vitrages légèrement teintés", href: "/glass" },
      { name: "Miroir sans tain", text: "Voir sans être vu, de jour", count: 4, src: miroir, alt: "Vitrage réfléchissant le ciel et les nuages", href: "/glass" },
      { name: "Couleurs", text: "Films solaires teintés", count: 11, src: couleursSolaires, alt: "Tours aux vitrages teintés", href: "/glass" },
      { name: "Anti-décoloration", text: "Protège vitrines et mobilier des UV", count: 5, src: antiDecoloration, alt: "Vitrine de boutique colorée", href: "/glass" },
      { name: "Sécurité", text: "Anti-éclats et anti-effraction", src: securite, alt: "Illustration abstraite d'un film de protection", href: "/glass" },
    ],
  },
];
