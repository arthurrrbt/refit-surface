import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/site/LegalLinks";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Espace gérant",
  robots: { index: false },
};

export default function ConnexionPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center" aria-label="Retour au site">
          <Logo size="md" />
        </Link>
        <div className="mt-10 rounded-sm border border-line bg-ink-2 p-8">
          <h1 className="font-display text-lg font-semibold">Espace gérant</h1>
          <p className="mt-1 mb-8 text-sm text-paper/60">Prospects, devis, factures et planning.</p>
          <LoginForm />
        </div>
        <LegalLinks className="mt-8 text-xs text-paper/70" linkClassName="hover:text-paper" />
      </div>
    </main>
  );
}
