"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

/**
 * Lien du logo vers l'accueil. Déjà sur l'accueil : au lieu de recharger la page, remonte en haut
 * avec un défilement fluide (immédiat si le visiteur a demandé moins d'animations).
 * Ailleurs : lien normal vers l'accueil.
 */
export function LogoLink({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Ctrl/Cmd/Maj + clic, clic molette : on laisse le navigateur ouvrir un nouvel onglet
    if (pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    if (window.location.hash) history.replaceState(null, "", "/"); // retire une ancre (#en-video…)
  };

  return (
    <Link href="/" aria-label="REFIT Surface — accueil" className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
