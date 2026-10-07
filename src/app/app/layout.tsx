import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Logo, RMark } from "@/components/brand/Logo";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { signOut } from "./actions";
import { BottomNav, BottomNavStatic, SidebarNav, SidebarNavStatic } from "./AppNav";
import Loading from "./loading";

export const metadata: Metadata = {
  title: { default: "Gestion", template: "%s | REFIT Gestion" },
  robots: { index: false, follow: false },
};

/** Ne rend le contenu qu'après vérification de la session (lecture des cookies → derrière Suspense). */
async function AuthGate({ children }: { children: ReactNode }) {
  const { user, isAdmin } = await getSessionUser();
  if (!user) redirect("/connexion");
  if (!isAdmin) return <AccessDenied email={user.email} />;
  return children;
}

function AccessDenied({ email }: { email: string }) {
  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-lg rounded-sm border border-red-200 bg-paper p-6">
        <h1 className="font-display text-lg font-semibold">Accès refusé</h1>
        <p className="mt-2 text-sm text-ink/70">
          Le compte <strong>{email}</strong> est connecté mais n&apos;est pas déclaré comme gérant. Exécutez{" "}
          <code>supabase/create-admin.sql</code> avec cette adresse dans le SQL Editor de Supabase.
        </p>
        <form action={signOut} className="mt-4">
          <button className="text-sm font-semibold text-accent-strong underline">Se déconnecter</button>
        </form>
      </div>
    </div>
  );
}

export default function BackOfficeLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-dvh flex-1 bg-mist text-ink">
      {/* Barre latérale (ordinateur) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-ink p-4 text-paper lg:flex">
        <Link href="/app" className="mb-8 flex justify-center pt-2">
          <Logo size="sm" />
        </Link>
        <nav aria-label="Back-office" className="flex-1">
          <Suspense fallback={<SidebarNavStatic />}>
            <SidebarNav />
          </Suspense>
        </nav>
        <form action={signOut}>
          <button className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-paper/50 hover:bg-ink-2 hover:text-paper">
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre du haut (mobile) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 text-paper lg:hidden">
          <Link href="/app" aria-label="Accueil gestion">
            <RMark className="h-6 w-auto" />
          </Link>
          <form action={signOut}>
            <button aria-label="Déconnexion" className="flex size-10 items-center justify-center text-paper/60">
              <LogOut className="size-5" />
            </button>
          </form>
        </header>

        <main className="flex-1 pb-24 lg:pb-0">
          <Suspense fallback={<Loading />}>
            <AuthGate>{children}</AuthGate>
          </Suspense>
        </main>

        {/* Navigation basse (mobile, utilisable au pouce sur chantier) */}
        <nav
          aria-label="Navigation mobile"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <Suspense fallback={<BottomNavStatic />}>
            <BottomNav />
          </Suspense>
        </nav>
      </div>
    </div>
  );
}
