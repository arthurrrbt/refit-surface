import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { modules } from "./modules";
import { PageHeader } from "./ModulePlaceholder";

const kpis = ["Demandes à traiter", "Devis en attente", "Poses cette semaine", "CA du mois"];

export default async function DashboardPage() {
  const { user } = await getSessionUser();
  return (
    <>
      <PageHeader title="Tableau de bord">Vue d&apos;ensemble de l&apos;activité REFIT Surface.</PageHeader>
      <div className="space-y-8 p-4 sm:p-8">
        <p className="flex items-center gap-2 text-sm text-ink/60">
          <ShieldCheck className="size-4 text-accent-strong" />
          Accès gérant vérifié — {user?.email}
        </p>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <li key={k} className="rounded-sm bg-paper p-4 shadow-sm">
              <p className="text-xs text-ink/50">{k}</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink/30">—</p>
            </li>
          ))}
        </ul>

        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules
            .filter((m) => m.href !== "/app")
            .map(({ href, label, icon: Icon, ...m }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex h-full items-start gap-4 rounded-sm bg-paper p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-ink text-accent">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-display font-semibold">{label}</span>
                    <span className="mt-1 block text-sm text-ink/60">{"description" in m ? m.description : null}</span>
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </>
  );
}
