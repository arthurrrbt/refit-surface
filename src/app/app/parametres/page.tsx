import type { Metadata } from "next";
import { Suspense } from "react";
import { company } from "@/content/company";
import { getSettings } from "@/lib/quotes/data";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Paramètres">Règles de chiffrage appliquées aux nouveaux devis.</PageHeader>
      <Suspense fallback={<Loading />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const settings = await getSettings();
  const missing = Object.entries(company).filter(([, v]) => typeof v === "string" && v.startsWith("["));
  return (
    <div className="max-w-3xl space-y-6 p-4 sm:p-8">
      <SettingsForm settings={settings} />
      <section className="rounded-sm bg-paper p-5 text-sm shadow-sm">
        <h2 className="font-display font-semibold">Mentions légales des devis et factures</h2>
        {missing.length ? (
          <p className="mt-2 text-amber-700">
            À compléter dans <code>src/content/company.ts</code> avant le premier envoi : {missing.map(([k]) => k).join(", ")}.
          </p>
        ) : (
          <p className="mt-2 text-emerald-700">Toutes les mentions obligatoires sont renseignées.</p>
        )}
      </section>
    </div>
  );
}
