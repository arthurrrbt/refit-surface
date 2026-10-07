import "server-only";
import { company } from "@/content/company";
import { hasPhone } from "@/content/site";
import { univers as universList } from "@/content/univers";
import { delais, glassGoals, surfaceTypes, type DevisInput } from "@/lib/devis/schema";

export type ExampleProject = { title: string; city: string | null; beforeUrl: string; afterUrl: string };

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cm = (n?: number) => (n ? `${new Intl.NumberFormat("fr-FR").format(n)} cm` : "?");

const INK = "#0d0e0f";
const ACCENT = "#0092c4";
const MUTED = "#5f6266";

/**
 * Confirmation envoyée au client après sa demande de devis.
 * Le texte libre (message, finitions, société) n'est volontairement pas recopié :
 * l'e-mail ne doit pas pouvoir servir à relayer un contenu saisi par un tiers.
 * Pour la même raison, les choix (surfaces, objectifs, délai) ne sont repris que s'ils figurent dans les listes du formulaire.
 */
export function devisConfirmationEmail(d: DevisInput, photoCount: number, origin: string, example: ExampleProject | null) {
  const u = universList.find((x) => x.slug === d.univers);
  const firstName = escape(d.firstName.slice(0, 40));
  const knownTypes = surfaceTypes[d.univers];
  const surfaces = d.surfaces.map((s) => ({
    type: knownTypes.includes(s.type) ? s.type : "Autre",
    dims: s.largeurCm || s.hauteurCm ? `${cm(s.largeurCm)} × ${cm(s.hauteurCm)}` : "dimensions à préciser",
    qty: s.quantite,
  }));
  const objectifs = d.objectifs.filter((g) => glassGoals.includes(g));
  const details = [
    objectifs.length ? ["Objectifs", objectifs.join(", ")] : null,
    d.delai && delais.includes(d.delai) ? ["Délai souhaité", d.delai] : null,
    ["Photos jointes", photoCount ? `${photoCount} photo${photoCount > 1 ? "s" : ""}` : "aucune (vous pourrez nous en envoyer par retour d'e-mail)"],
  ].filter(Boolean) as [string, string][];
  const galleryUrl = `${origin}/realisations?univers=${d.univers}`;
  const contactLine = [hasPhone ? company.phone : null, company.email].filter(Boolean).join(" · ");

  const subject = "Votre demande de devis REFIT Surface";

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:${INK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:4px;overflow:hidden;">
  <tr><td style="background:${INK};padding:24px 28px;">
    <div style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:1px;">REFIT</div>
    <div style="color:#ffffff;font-size:11px;letter-spacing:6px;">SURFACE</div>
    <div style="width:40px;height:2px;background:#00b4ef;margin-top:12px;"></div>
  </td></tr>
  <tr><td style="padding:28px;">
    <h1 style="margin:0 0 12px;font-size:20px;">Merci ${firstName}, votre demande est bien reçue</h1>
    <p style="margin:0 0 20px;line-height:1.5;color:${MUTED};">Nous étudions votre projet${u ? ` <strong style="color:${INK};">${escape(u.name)} — ${escape(u.title)}</strong>` : ""} et revenons vers vous rapidement pour convenir d'une visite et d'un métrage.</p>

    <h2 style="margin:0 0 8px;font-size:15px;">Récapitulatif de votre demande</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      ${surfaces
        .map(
          (s) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e5e2;">${escape(s.type)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e5e2;color:${MUTED};text-align:right;">${escape(s.dims)} · qté ${s.qty}</td>
      </tr>`,
        )
        .join("")}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:14px;">
      ${details.map(([k, v]) => `<tr><td style="padding:3px 0;color:${MUTED};width:140px;">${k}</td><td style="padding:3px 0;">${escape(v)}</td></tr>`).join("")}
    </table>
    <p style="margin:12px 0 0;font-size:13px;color:${MUTED};">Votre message nous a bien été transmis.</p>

    ${
      example
        ? `<h2 style="margin:28px 0 8px;font-size:15px;">Un exemple de réalisation</h2>
    <p style="margin:0 0 10px;font-size:14px;color:${MUTED};">${escape(example.title)}${example.city ? ` · ${escape(example.city)}` : ""}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="50%" style="padding-right:4px;vertical-align:top;">
        <img src="${escape(example.beforeUrl)}" alt="Avant" width="268" style="display:block;width:100%;height:auto;border-radius:3px;">
        <div style="font-size:11px;letter-spacing:2px;color:${MUTED};margin-top:4px;">AVANT</div>
      </td>
      <td width="50%" style="padding-left:4px;vertical-align:top;">
        <img src="${escape(example.afterUrl)}" alt="Après" width="268" style="display:block;width:100%;height:auto;border-radius:3px;">
        <div style="font-size:11px;letter-spacing:2px;color:${ACCENT};margin-top:4px;">APRÈS</div>
      </td>
    </tr></table>`
        : ""
    }
    <p style="margin:20px 0 0;"><a href="${escape(galleryUrl)}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:3px;font-size:13px;font-weight:bold;letter-spacing:1px;">VOIR NOS RÉALISATIONS</a></p>

    <h2 style="margin:28px 0 8px;font-size:15px;">La suite</h2>
    <ol style="margin:0;padding-left:20px;line-height:1.6;font-size:14px;color:${MUTED};">
      <li>Nous vous contactons pour fixer une visite et un métrage.</li>
      <li>Vous recevez un devis détaillé, à signer en ligne.</li>
      <li>Nous planifions la pose ensemble.</li>
    </ol>
    <p style="margin:20px 0 0;font-size:14px;">Une question ? Répondez simplement à cet e-mail.</p>
    <p style="margin:8px 0 0;font-size:14px;">Arnaud Biet — ${escape(company.name)}</p>
  </td></tr>
  <tr><td style="background:#f4f4f2;padding:16px 28px;font-size:11px;line-height:1.5;color:${MUTED};">
    ${escape(company.name)} · ${escape(company.city)}${contactLine ? ` · ${escape(contactLine)}` : ""}<br>
    Vous recevez cet e-mail car une demande de devis a été faite avec cette adresse sur notre site. Si ce n'est pas vous, ignorez-le ou écrivez-nous.
    <a href="${escape(origin)}/confidentialite" style="color:${MUTED};">Politique de confidentialité</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    `Merci ${d.firstName.slice(0, 40)}, votre demande est bien reçue.`,
    u ? `Projet : ${u.name} — ${u.title}` : "",
    "",
    "Récapitulatif :",
    ...surfaces.map((s) => `- ${s.type} : ${s.dims}, qté ${s.qty}`),
    ...details.map(([k, v]) => `${k} : ${v}`),
    "Votre message nous a bien été transmis.",
    "",
    example ? `Exemple de réalisation : ${example.title}${example.city ? ` (${example.city})` : ""}` : "",
    `Nos réalisations : ${galleryUrl}`,
    "",
    "La suite : visite et métrage, puis devis détaillé à signer en ligne, puis planification de la pose.",
    "Une question ? Répondez simplement à cet e-mail.",
    "",
    `Arnaud Biet — ${company.name}`,
    `Politique de confidentialité : ${origin}/confidentialite`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return { subject, html, text };
}
