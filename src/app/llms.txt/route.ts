import { company } from "@/content/company";
import { site } from "@/content/site";
import { univers } from "@/content/univers";

// /llms.txt : présentation du site en clair pour les agents IA (format llmstxt.org),
// générée à partir des mêmes contenus que le site pour rester à jour.
export function GET() {
  const body = `# ${site.name}

> ${site.description}

${site.name} est une entreprise de rénovation de surfaces basée à ${site.city} (${site.region}), qui intervient à ${site.areaServed.join(", ")}. Promesse : « ${site.tagline} ». Particuliers et professionnels. Devis gratuit sur demande ; pas de vente en ligne.

## Univers

${univers.map((u) => `- [${u.name} — ${u.title}](${site.url}/${u.slug}) : ${u.pitch} ${u.forWho}.`).join("\n")}

## Pages principales

- [Accueil](${site.url}/)
- [Réalisations avant / après](${site.url}/realisations)
- [Demande de devis](${site.url}/devis)
- [Prise de rendez-vous (visite et métrage)](${site.url}/rendez-vous)
- [Contact](${site.url}/contact) : ${company.email}

## Informations

- [Mentions légales](${site.url}/mentions-legales)
- [Politique de confidentialité](${site.url}/confidentialite)
- [Conditions générales de prestation](${site.url}/cgv)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
