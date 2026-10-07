import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { getDashboardData } from "@/lib/agents/data";
import { getSessionUser } from "@/lib/auth";
import { euro } from "@/lib/quotes/pricing";
import { BriefCard } from "./agents/components";
import Loading from "./loading";
import { modules } from "./modules";
import { PageHeader } from "./ModulePlaceholder";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Tableau de bord">Vue d&apos;ensemble de l&apos;activité REFIT Surface.</PageHeader>
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const [{ user }, { counts, brief }] = await Promise.all([getSessionUser(), getDashboardData()]);
  const kpis = [
    { label: "Demandes à traiter", value: counts.nouveaux, href: "/app/prospects" },
    { label: "Relances du jour", value: counts.relancesDuJour, href: "/app/agents" },
    { label: "À encaisser", value: counts.aEncaisser, href: "/app/factures", money: true },
    { label: "Devis en attente", value: counts.devisEnAttente, href: "/app/prospects" },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <p className="flex items-center gap-2 text-sm text-ink/60">
        <ShieldCheck className="size-4 text-accent-strong" />
        Accès gérant vérifié — {user?.email}
      </p>

      <BriefCard run={brief} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label}>
            <Link href={k.href} className="block rounded-sm bg-paper p-4 shadow-sm transition-shadow hover:shadow-md">
              <p className="text-xs text-ink/50">{k.label}</p>
              <p className={`mt-2 font-display text-2xl font-semibold ${k.value ? "text-ink" : "text-ink/30"}`}>{"money" in k ? euro.format(k.value) : k.value}</p>
            </Link>
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
  );
}
