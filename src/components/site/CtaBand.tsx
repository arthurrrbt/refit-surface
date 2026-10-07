import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/content/site";

export function CtaBand() {
  return (
    <section className="border-t border-line bg-ink-2">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
        <div>
          <p className="font-display text-xl font-semibold sm:text-2xl">Un projet à {site.city} ou alentours ?</p>
          <p className="mt-2 text-paper/65">Envoyez quelques photos de vos surfaces : nous revenons vers vous rapidement.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/devis">Demander un devis</ButtonLink>
          <ButtonLink href="/rendez-vous" variant="outline">
            Prendre rendez-vous
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
