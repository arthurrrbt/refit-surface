import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { company } from "@/content/company";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Comment ${site.name} traite vos données personnelles : demandes de devis, rendez-vous, signature des devis, facturation.`,
  alternates: { canonical: "/confidentialite" },
};

// Rédigée à partir des traitements présents dans le code : formulaires /devis et /rendez-vous,
// signature en ligne /signature, back-office (CRM, devis, factures, chantiers), agents IA, stockage Supabase.
const treatments = [
  {
    name: "Demande de devis (formulaire du site)",
    data: "Nom, prénom, e-mail, téléphone, code postal, ville, type de client (particulier ou professionnel), société, description du projet, surfaces et dimensions, photos que vous envoyez.",
    purpose: "Étudier votre projet, vous envoyer un e-mail récapitulatif de votre demande, vous recontacter et établir un devis.",
    basis: "Mesures précontractuelles prises à votre demande (art. 6.1.b du RGPD).",
    duration: "3 ans après notre dernier échange si aucun contrat n'est conclu ; sinon, durée du contrat puis archivage (voir ci-dessous).",
  },
  {
    name: "Prise de rendez-vous en ligne",
    data: "Nom, prénom, e-mail, téléphone, adresse du rendez-vous, univers concerné, précisions éventuelles.",
    purpose: "Organiser la visite et le métrage, vous joindre en cas d'imprévu.",
    basis: "Mesures précontractuelles prises à votre demande (art. 6.1.b).",
    duration: "3 ans après notre dernier échange si aucun contrat n'est conclu.",
  },
  {
    name: "Devis et signature électronique",
    data: "Identité et adresse, contenu du devis, nom saisi, signature tracée, date et heure, adresse IP, navigateur, empreinte numérique du document, demande éventuelle de démarrage anticipé.",
    purpose: "Conclure le contrat et conserver la preuve de votre acceptation.",
    basis: "Exécution du contrat (art. 6.1.b) et intérêt légitime à prouver le contrat (art. 6.1.f).",
    duration: "5 ans après la fin des travaux (délai de prescription).",
  },
  {
    name: "Réalisation des travaux et suivi de chantier",
    data: "Adresse du chantier, dates d'intervention, notes d'accès, matériaux commandés, photos avant / pendant / après.",
    purpose: "Planifier, réaliser et suivre la prestation.",
    basis: "Exécution du contrat (art. 6.1.b).",
    duration: "5 ans après la fin des travaux.",
  },
  {
    name: "Facturation et comptabilité",
    data: "Identité, adresse, SIREN pour les professionnels, factures, avoirs, paiements reçus.",
    purpose: "Facturer, encaisser et respecter nos obligations comptables et fiscales.",
    basis: "Obligation légale (art. 6.1.c).",
    duration: "10 ans (article L123-22 du Code de commerce).",
  },
  {
    name: "Relances concernant votre demande ou votre devis",
    data: "Coordonnées et état de votre demande ou de votre devis.",
    purpose: "Vous relancer au sujet d'un devis en cours (par e-mail ou téléphone).",
    basis: "Intérêt légitime (art. 6.1.f) — vous pouvez vous y opposer à tout moment.",
    duration: "Jusqu'à la conclusion ou l'abandon du projet, dans la limite de 3 ans.",
  },
  {
    name: "Conseils et réalisations (actualités)",
    data: "E-mail et prénom.",
    purpose: "Vous envoyer occasionnellement des conseils et nos dernières réalisations.",
    basis: "Votre consentement (case facultative, non cochée par défaut) — retirable à tout moment.",
    duration: "Jusqu'au retrait de votre consentement, au plus 3 ans sans interaction.",
  },
  {
    name: "Publication de réalisations dans la galerie",
    data: "Photos avant / après du chantier et ville (jamais votre nom ni votre adresse).",
    purpose: "Présenter nos réalisations sur le site.",
    basis: "Votre accord préalable, demandé au cas par cas.",
    duration: "Jusqu'au retrait de votre accord.",
  },
];

export default function ConfidentialitePage() {
  return (
    <LegalPage eyebrow="Données personnelles" title="Politique de confidentialité" updated="7 octobre 2026">
      <section>
        <h2>Responsable du traitement</h2>
        <p>
          {company.name} — {company.legalForm} — {company.address}, {company.postalCode} {company.city} — SIRET {company.siret}. Contact pour toute
          question sur vos données : <a href={`mailto:${company.email}`}>{company.email}</a>.
        </p>
      </section>

      <section>
        <h2>Les traitements que nous réalisons</h2>
        <p>Nous ne collectons que les données utiles à chaque finalité. Les champs obligatoires des formulaires sont signalés par un astérisque.</p>
        {treatments.map((t) => (
          <div key={t.name}>
            <h3>{t.name}</h3>
            <ul>
              <li>Données : {t.data}</li>
              <li>Finalité : {t.purpose}</li>
              <li>Base légale : {t.basis}</li>
              <li>Durée de conservation : {t.duration}</li>
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2>Analyse des demandes par intelligence artificielle</h2>
        <p>
          Pour traiter plus vite les demandes, le contenu de votre demande et vos photos peuvent être analysés par un service
          d&apos;intelligence artificielle (Claude, édité par Anthropic) qui prépare un résumé, des questions et un brouillon de réponse.
          Votre e-mail et votre téléphone ne lui sont pas transmis. Aucune décision n&apos;est prise automatiquement : le gérant relit et
          décide de chaque suite donnée. Vous pouvez vous opposer à cette analyse en nous écrivant.
        </p>
      </section>

      <section>
        <h2>Qui a accès à vos données</h2>
        <ul>
          <li>Le gérant de {company.name}, seul utilisateur de l&apos;outil de gestion (accès protégé par mot de passe).</li>
          <li>Nos prestataires techniques, qui agissent uniquement sur nos instructions :</li>
        </ul>
        <table>
          <thead>
            <tr>
              <th>Prestataire</th>
              <th>Rôle</th>
              <th>Localisation des données</th>
              <th>Garantie en cas de transfert hors UE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase Inc.</td>
              <td>Base de données et stockage des photos et documents</td>
              <td>Serveurs dans l&apos;Union européenne</td>
              <td>Accord de sous-traitance (DPA)</td>
            </tr>
            <tr>
              <td>Vercel Inc. (États-Unis)</td>
              <td>Hébergement et affichage du site</td>
              <td>Serveurs à Paris ; société américaine</td>
              <td>Data Privacy Framework UE–États-Unis et clauses contractuelles types</td>
            </tr>
            <tr>
              <td>Microsoft Ireland Operations Ltd (Microsoft 365)</td>
              <td>Messagerie : envoi des e-mails (confirmation de demande, devis, factures) et réception de vos réponses</td>
              <td>Union européenne</td>
              <td>Accord de traitement des données (DPA) et clauses contractuelles types</td>
            </tr>
            <tr>
              <td>Anthropic PBC (États-Unis)</td>
              <td>Analyse des demandes par IA (voir ci-dessus)</td>
              <td>États-Unis</td>
              <td>Clauses contractuelles types de la Commission européenne (accord de traitement des données)</td>
            </tr>
          </tbody>
        </table>
        <p>Vos données ne sont jamais vendues ni utilisées à des fins publicitaires.</p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de portabilité de
          vos données, ainsi que du droit de retirer votre consentement à tout moment et de définir des directives sur leur sort après votre
          décès. Pour les exercer, écrivez à <a href={`mailto:${company.email}`}>{company.email}</a> ; nous répondons sous un mois.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL : <a href="https://www.cnil.fr/fr/plaintes">cnil.fr/plaintes</a>,
          3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
        </p>
      </section>

      <section>
        <h2>Sécurité</h2>
        <p>
          Connexions chiffrées (HTTPS), accès à l&apos;outil de gestion réservé au gérant, photos des demandes et documents stockés dans un espace
          privé, liens de signature et de facture personnels et non devinables.
        </p>
      </section>

      <section>
        <h2 id="cookies">Cookies et traceurs</h2>
        <p>
          <strong>Ce site ne dépose aucun cookie publicitaire, de mesure d&apos;audience ou de réseau social</strong> et ne charge aucun service
          tiers qui en déposerait (les polices de caractères sont hébergées sur notre propre site). C&apos;est pourquoi aucun bandeau de cookies
          ne vous est présenté.
        </p>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Émetteur</th>
              <th>Finalité</th>
              <th>Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>sb-…-auth-token</td>
              <td>{company.name} (via Supabase)</td>
              <td>Maintenir la connexion du gérant à l&apos;espace de gestion — strictement nécessaire, déposé uniquement à la connexion</td>
              <td>Durée de la session, renouvelée à chaque connexion</td>
            </tr>
          </tbody>
        </table>
        <p>
          Les liens vers nos réseaux sociaux sont de simples liens : aucun contenu de ces réseaux n&apos;est chargé sur nos pages. Voir aussi les{" "}
          <Link href="/mentions-legales">mentions légales</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
