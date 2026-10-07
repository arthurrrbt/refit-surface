import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { phoneHref, site } from "@/content/site";
import { univers } from "@/content/univers";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-ink">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size="md" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/60">{site.description}</p>
          <p className="mt-4 text-sm text-paper/80">{site.certifications.join(" • ")}</p>
        </div>

        <div>
          <p className="eyebrow">Univers</p>
          <ul className="mt-4 space-y-2 text-sm">
            {univers.map((u) => (
              <li key={u.slug}>
                <Link href={`/${u.slug}`} className="text-paper/70 hover:text-accent">
                  {u.name} — {u.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-paper/70">
            <li className="flex items-center gap-3">
              <Phone className="size-4 text-accent" />
              <a href={phoneHref} className="hover:text-accent">
                {site.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 text-accent" />
              <a href={`mailto:${site.email}`} className="hover:text-accent">
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 text-accent" />
              {site.city} et Côte d&apos;Émeraude
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-paper/40 sm:flex-row sm:justify-between sm:px-6">
          <p>© {site.name}</p>
          <div className="flex gap-6">
            <Link href="/mentions-legales" className="hover:text-paper">
              Mentions légales
            </Link>
            <Link href="/connexion" className="hover:text-paper">
              Espace gérant
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
