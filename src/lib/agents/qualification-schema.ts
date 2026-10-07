// Format de sortie de l'agent Qualification (partagé avec l'affichage du back-office).
import { z } from "zod";

export const qualificationSchema = z.object({
  resume: z.string().describe("Résumé du projet en 2 ou 3 phrases, factuel."),
  univers: z
    .enum(["home", "glass", "pro", "boat"])
    .describe("Univers le plus adapté ; peut corriger celui choisi par le client."),
  score: z
    .number()
    .int()
    .describe("Note de 0 à 100 : intérêt commercial et probabilité de transformer la demande en chantier."),
  justification_score: z.string().describe("Pourquoi cette note, en une ou deux phrases."),
  priorite: z.enum(["haute", "moyenne", "basse"]),
  faisabilite: z
    .enum(["favorable", "a_verifier", "defavorable"])
    .describe("Faisabilité technique d'après la description et les photos."),
  observations_photos: z
    .string()
    .nullable()
    .describe("Ce que montrent les photos : support, matériau, état, contraintes. null s'il n'y a aucune photo."),
  points_vigilance: z.array(z.string()).describe("Risques techniques ou commerciaux à vérifier (0 à 5)."),
  questions_a_poser: z.array(z.string()).describe("2 à 5 questions précises pour compléter le dossier."),
  prochaine_action: z.enum(["appeler", "planifier_visite", "demander_photos", "envoyer_estimation", "decliner"]),
  brouillon_email: z
    .object({
      objet: z.string(),
      corps: z.string().describe("Texte brut, vouvoiement, 150 mots maximum, signé Arnaud Biet."),
    })
    .describe("Réponse à envoyer au client après relecture par le gérant."),
});

export type Qualification = z.infer<typeof qualificationSchema>;

export const prochaineActionLabels: Record<Qualification["prochaine_action"], string> = {
  appeler: "Appeler le client",
  planifier_visite: "Planifier une visite / métrage",
  demander_photos: "Demander des photos",
  envoyer_estimation: "Envoyer une première estimation",
  decliner: "Décliner poliment",
};

export const faisabiliteLabels: Record<Qualification["faisabilite"], string> = {
  favorable: "Favorable",
  a_verifier: "À vérifier",
  defavorable: "Défavorable",
};
