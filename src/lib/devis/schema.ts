// Partagé client / serveur : options du formulaire de devis et validation.
import { z } from "zod";

export const UNIVERS = ["home", "glass", "pro", "boat"] as const;
export type UniversValue = (typeof UNIVERS)[number];

export const surfaceTypes: Record<UniversValue, string[]> = {
  home: ["Façades de cuisine", "Plan de travail", "Crédence", "Portes", "Placards / dressing", "Meuble", "Salle de bain", "Autre"],
  glass: ["Baie vitrée", "Fenêtre", "Véranda", "Vitrine", "Porte vitrée", "Cloison vitrée", "Autre"],
  pro: ["Portes", "Mobilier", "Comptoir / bar", "Tables", "Habillage mural", "Vitrage", "Autre"],
  boat: ["Boiseries", "Portes / placards", "Plan de travail", "Table", "Hublots", "Autre"],
};

export const glassGoals = ["Chaleur / soleil", "Éblouissement", "Intimité", "Sécurité", "Décoration"];
export const delais = ["Dès que possible", "Dans 1 à 3 mois", "Plus tard / je me renseigne"];

export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const surfaceSchema = z.object({
  type: z.string().trim().min(1).max(80),
  largeurCm: z.number().positive().max(5000).optional(),
  hauteurCm: z.number().positive().max(5000).optional(),
  quantite: z.number().int().min(1).max(500),
});

export const devisSchema = z
  .object({
    univers: z.enum(UNIVERS),
    surfaces: z.array(surfaceSchema).min(1).max(20),
    objectifs: z.array(z.string().max(40)).max(10),
    finitions: optionalText(500),
    delai: optionalText(60),
    kind: z.enum(["particulier", "professionnel"]),
    company: optionalText(120),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().max(200),
    phone: z.string().trim().min(6).max(30),
    postalCode: optionalText(10),
    city: optionalText(80),
    message: optionalText(3000),
    marketingConsent: z.boolean(),
    uploadId: z.uuid().optional(),
    photos: z.array(z.string().max(200)).max(MAX_PHOTOS),
    website: z.string().optional(), // piège à robots : doit rester vide
  })
  .refine((d) => d.kind === "particulier" || Boolean(d.company), {
    message: "Indiquez le nom de votre établissement.",
    path: ["company"],
  });

export type DevisInput = z.infer<typeof devisSchema>;
