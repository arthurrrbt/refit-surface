import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LogoLink } from "@/components/site/LogoLink";
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
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <LogoLink className="shrink-0">
          <Logo size="header" />
        </LogoLink>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-5 xl:gap-9">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="whitespace-nowrap font-display text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-paper/85 xl:text-sm xl:tracking-[0.18em] transition-colors hover:text-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ButtonLink href="/rendez-vous" variant="outline" size="sm" className="whitespace-nowrap">
              Prendre rendez-vous
            </ButtonLink>
          </div>

          {/* Menu mobile sans JavaScript */}
          <MobileMenu className="group lg:hidden">
            <summary
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-md border border-line [&::-webkit-details-marker]:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5 group-open:hidden" />
              <X className="hidden size-5 group-open:block" />
            </summary>
            <nav
              aria-label="Navigation mobile"
              className="absolute inset-x-0 top-20 border-b border-line bg-ink px-4 pb-6 pt-2"
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
              <ButtonLink href="/rendez-vous" className="mt-6 w-full">
                Prendre rendez-vous
              </ButtonLink>
            </nav>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
