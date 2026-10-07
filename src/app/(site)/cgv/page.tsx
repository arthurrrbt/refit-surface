import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { company } from "@/content/company";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Conditions générales de prestation",
  description: `Conditions générales de prestation de ${site.name} : devis, prix, acompte, rétractation, garanties, médiation.`,
  alternates: { canonical: "/cgv" },
};

// Prestations de rénovation (fourniture et pose) sur devis, sans paiement en ligne.
// Le contrat est formé par la signature du devis : à distance (lien en ligne) ou chez le client
// (contrat hors établissement) → droit de rétractation de 14 jours pour les particuliers.
// À faire relire par un avocat avant mise en service.
export default function CgvPage() {
  return (
    <LegalPage eyebrow="Conditions générales" title="Conditions générales de prestation" updated="7 octobre 2026">
      <section>
        <h2>1. Objet et champ d&apos;application</h2>
        <p>
          Les présentes conditions s&apos;appliquent aux prestations de rénovation de surfaces et de pose de films pour vitrages réalisées par{" "}
          {company.name} ({company.legalForm}, {company.address}, {company.postalCode} {company.city}, SIRET {company.siret}, {company.email})
          pour des clients particuliers (« consommateurs ») et professionnels. Elles font partie intégrante de chaque devis. Les dispositions
          propres aux particuliers ou aux professionnels sont signalées.
        </p>
      </section>

      <section>
        <h2>2. Devis et formation du contrat</h2>
        <ul>
          <li>Le devis est gratuit. Il détaille les prestations, les matériaux (références, surfaces), la durée de pose estimée et le prix.</li>
          <li>Il est valable pendant la durée qui y est indiquée.</li>
          <li>
            Le contrat est conclu par la signature du devis, en ligne (lien personnel, signature électronique) ou sur papier, accompagnée de la
            mention « Bon pour accord » et de l&apos;acceptation des présentes conditions.
          </li>
          <li>Toute prestation supplémentaire fait l&apos;objet d&apos;un avenant ou d&apos;un nouveau devis accepté.</li>
        </ul>
      </section>

      <section>
        <h2>3. Prix</h2>
        <p>
          Les prix sont indiqués hors taxes et toutes taxes comprises (TVA au taux en vigueur), fournitures, pose et déplacement compris
          lorsque le devis le mentionne. Aucun frais non indiqué sur le devis ne peut être facturé.
        </p>
      </section>

      <section>
        <h2>4. Acompte et paiement</h2>
        <ul>
          <li>Paiement par virement ou par chèque. Aucun paiement n&apos;est effectué sur le site.</li>
          <li>Professionnels : acompte indiqué sur le devis à la signature, solde à la fin des travaux, à réception de la facture.</li>
          <li>
            Particuliers : lorsque le devis est signé hors de nos locaux (à votre domicile notamment), aucun paiement ne peut être exigé avant
            l&apos;expiration d&apos;un délai de 7 jours à compter de la signature (article L221-10 du Code de la consommation). L&apos;acompte
            est donc demandé au plus tôt à l&apos;issue de ce délai ; le solde à la fin des travaux.
          </li>
          <li>
            Retard de paiement — particuliers : intérêts au taux légal après mise en demeure (article 1231-6 du Code civil). Professionnels :
            pénalités au taux de refinancement de la Banque centrale européenne majoré de 10 points et indemnité forfaitaire de 40 € pour
            frais de recouvrement, dues de plein droit (articles L441-10 et D441-5 du Code de commerce). Pas d&apos;escompte pour paiement
            anticipé.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Exécution des travaux</h2>
        <ul>
          <li>La date d&apos;intervention est convenue avec le client après la signature ; elle figure au planning communiqué.</li>
          <li>
            Le client donne accès aux surfaces à rénover et signale toute contrainte (humidité, chaleur, état du support). Les revêtements
            adhésifs nécessitent des supports sains, propres et lisses ; une préparation peut être proposée si nécessaire.
          </li>
          <li>Un retard dû à un cas de force majeure ou au défaut d&apos;accès au chantier ne peut être reproché au prestataire.</li>
        </ul>
      </section>

      <section id="retractation">
        <h2>6. Droit de rétractation (clients particuliers)</h2>
        <p>
          Lorsque le devis est signé à distance (en ligne) ou hors de nos locaux, le client particulier dispose d&apos;un délai de{" "}
          <strong>14 jours à compter de la signature</strong> pour se rétracter, sans avoir à se justifier ni à payer de pénalité (articles
          L221-18 et suivants du Code de la consommation).
        </p>
        <ul>
          <li>
            Pour l&apos;exercer, il suffit d&apos;envoyer avant l&apos;expiration du délai le formulaire ci-dessous ou toute déclaration dénuée
            d&apos;ambiguïté à <a href={`mailto:${company.email}`}>{company.email}</a> ou par courrier à {company.address}, {company.postalCode}{" "}
            {company.city}.
          </li>
          <li>Les sommes versées sont remboursées au plus tard 14 jours après réception de la rétractation, par le même moyen de paiement.</li>
          <li>
            Si le client a demandé expressément que les travaux commencent avant la fin du délai, il reste redevable d&apos;un montant
            proportionnel aux prestations déjà réalisées à la date de sa rétractation (article L221-25).
          </li>
          <li>Le droit de rétractation ne peut être exercé dans les cas prévus par l&apos;article L221-28 du Code de la consommation.</li>
        </ul>
      </section>

      <section>
        <h2>7. Réception, réserve de propriété et garanties</h2>
        <ul>
          <li>Les travaux sont réceptionnés à leur achèvement, en présence du client si possible ; toute réserve est notée par écrit.</li>
          <li>Les matériaux fournis restent la propriété de {company.name} jusqu&apos;au paiement intégral du prix (réserve de propriété).</li>
          <li>
            Le client bénéficie de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation, pour les biens
            fournis et leur installation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil), indépendamment des
            garanties commerciales des fabricants.
          </li>
          <li>Assurance professionnelle : {company.insurance}.</li>
        </ul>
      </section>

      <section>
        <h2>8. Réclamations</h2>
        <p>
          Toute réclamation est adressée à <a href={`mailto:${company.email}`}>{company.email}</a> ou par courrier au siège. Nous y répondons
          dans les meilleurs délais.
        </p>
      </section>

      <section id="mediation">
        <h2>9. Médiation de la consommation (clients particuliers)</h2>
        <p>
          Après une réclamation écrite restée sans solution, le client particulier peut recourir gratuitement au médiateur de la consommation
          dont nous relevons : {company.mediator.name} — {company.mediator.address} — {company.mediator.website} (articles L611-1 et suivants
          du Code de la consommation).
        </p>
      </section>

      <section>
        <h2>10. Données personnelles</h2>
        <p>
          Voir notre <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </section>

      <section>
        <h2>11. Droit applicable et litiges</h2>
        <p>
          Les présentes conditions sont soumises au droit français. Pour les particuliers, le litige peut être porté devant la juridiction du
          lieu de leur domicile ou du lieu d&apos;exécution des travaux. Pour les professionnels, compétence est attribuée aux tribunaux du
          ressort du siège de {company.name}.
        </p>
      </section>

      <section id="formulaire-retractation">
        <h2>Annexe — Formulaire de rétractation</h2>
        <p>(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)</p>
        <div className="mt-4 rounded-sm border border-line bg-ink-2 p-5 text-sm">
          <p>
            À l&apos;attention de {company.name}, {company.address}, {company.postalCode} {company.city} — {company.email} :
          </p>
          <p>Je/Nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la prestation de services ci-dessous :</p>
          <p>Référence du devis : …………………………</p>
          <p>Signé le (*) : …………………………</p>
          <p>Nom du (des) consommateur(s) : …………………………</p>
          <p>Adresse du (des) consommateur(s) : …………………………</p>
          <p>Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) : …………………………</p>
          <p>Date : …………………………</p>
          <p className="text-paper/70">(*) Rayez la mention inutile.</p>
        </div>
      </section>
    </LegalPage>
  );
}
