import Link from "next/link";

export const legalLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/confidentialite#cookies", label: "Cookies" },
  { href: "/cgv", label: "Conditions générales" },
];

/** Liens légaux présents en bas de toutes les pages (site, signature, connexion). */
export function LegalLinks({ className = "", linkClassName = "hover:underline" }: { className?: string; linkClassName?: string }) {
  return (
    <nav aria-label="Informations légales" className={className}>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {legalLinks.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={linkClassName}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
