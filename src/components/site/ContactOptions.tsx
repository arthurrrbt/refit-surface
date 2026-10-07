import { Mail, Phone } from "lucide-react";
import { hasPhone, phoneHref, site } from "@/content/site";

export function ContactOptions() {
  return (
    <div className={`mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 ${hasPhone ? "sm:grid-cols-2" : ""}`}>
      {hasPhone && (
        <a href={phoneHref} className="group rounded-sm border border-line bg-ink-2 p-8 transition-colors hover:border-accent">
          <Phone className="size-6 text-accent" strokeWidth={1.5} aria-hidden />
          <p className="mt-4 eyebrow">Téléphone</p>
          <p className="mt-2 font-display text-2xl font-semibold group-hover:text-accent">{site.phone}</p>
          <p className="mt-2 text-sm text-paper/60">{site.manager}, gérant</p>
        </a>
      )}
      <a href={`mailto:${site.email}`} className="group rounded-sm border border-line bg-ink-2 p-8 transition-colors hover:border-accent">
        <Mail className="size-6 text-accent" strokeWidth={1.5} aria-hidden />
        <p className="mt-4 eyebrow">E-mail</p>
        <p className="mt-2 break-all font-display text-2xl font-semibold group-hover:text-accent">{site.email}</p>
        <p className="mt-2 text-sm text-paper/60">Joignez quelques photos de vos surfaces</p>
      </a>
    </div>
  );
}
