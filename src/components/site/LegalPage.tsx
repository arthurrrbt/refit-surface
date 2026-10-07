import type { ReactNode } from "react";
import { PageIntro } from "./PageIntro";

/** Mise en page des pages juridiques : titres, listes, tableaux et liens lisibles. */
export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title}>
        Dernière mise à jour : {updated}
      </PageIntro>
      <article
        className="mx-auto max-w-3xl space-y-10 px-4 py-14 text-paper/85 sm:px-6
          [&_a]:text-accent [&_a]:underline
          [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-paper
          [&_h3]:mt-6 [&_h3]:font-display [&_h3]:font-semibold [&_h3]:text-paper
          [&_li]:mt-1 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5
          [&_table]:mt-4 [&_table]:w-full [&_table]:text-left [&_table]:text-sm
          [&_td]:border-t [&_td]:border-line [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top
          [&_th]:py-2 [&_th]:pr-3 [&_th]:font-semibold [&_th]:text-paper"
      >
        {children}
      </article>
    </>
  );
}
