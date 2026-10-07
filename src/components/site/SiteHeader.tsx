import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "@/components/site/MobileMenu";
import { ButtonLink } from "@/components/ui/Button";
import { univers } from "@/content/univers";

const links = [
  ...univers.map((u) => ({ href: `/${u.slug}`, label: u.name.replace("REFIT ", "") })),
  { href: "/realisations", label: "Réalisations" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="REFIT Surface — accueil" className="shrink-0">
          <Logo size="sm" />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="font-display text-xs font-medium uppercase tracking-[0.2em] text-paper/75 transition-colors hover:text-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ButtonLink href="/devis">Demander un devis</ButtonLink>
          </div>

          {/* Menu mobile sans JavaScript */}
          <MobileMenu className="group lg:hidden">
            <summary
              className="flex size-10 cursor-pointer list-none items-center justify-center rounded-sm border border-line [&::-webkit-details-marker]:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5 group-open:hidden" />
              <X className="hidden size-5 group-open:block" />
            </summary>
            <nav
              aria-label="Navigation mobile"
              className="absolute inset-x-0 top-16 border-b border-line bg-ink px-4 pb-6 pt-2"
            >
              <ul className="flex flex-col">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block border-b border-line/60 py-4 font-display text-sm uppercase tracking-[0.2em]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/devis" className="mt-6 w-full">
                Demander un devis
              </ButtonLink>
            </nav>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
