import Image from "next/image";
import type { UniversSlug } from "@/content/univers";

// Zone de public/brand/matieres.png à montrer pour chaque univers (x% y%).
const focus: Record<UniversSlug, string> = {
  home: "28% 40%", // marbre noir
  glass: "72% 62%", // vitrage
  pro: "28% 86%", // béton
  boat: "75% 22%", // bois
};

export function MaterialSwatch({ slug, className = "" }: { slug: UniversSlug; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <Image
        src="/brand/matieres.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, 100vw"
        className="object-cover scale-[2.4] transition-[scale] duration-700 group-hover:scale-[2.6]"
        style={{ objectPosition: focus[slug], transformOrigin: focus[slug] }}
      />
    </div>
  );
}
