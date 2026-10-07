import type { Metadata } from "next";
import { ContactOptions } from "@/components/site/ContactOptions";
import { PageIntro } from "@/components/site/PageIntro";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contactez ${site.name}, rénovation de surfaces et films pour vitrages à ${site.city}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageIntro eyebrow="Contact" title={`${site.name}, à ${site.city}`}>
        Nous intervenons à {site.areaServed.join(", ")}.
      </PageIntro>
      <ContactOptions />
    </>
  );
}
