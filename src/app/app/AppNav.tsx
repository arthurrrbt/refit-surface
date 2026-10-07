"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { modules } from "./modules";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

// Les versions « Static » servent de repli Suspense : sous une route dynamique, usePathname()
// n'est connu qu'à la requête.
export function SidebarNav() {
  return <SidebarNavStatic pathname={usePathname()} />;
}

export function BottomNav() {
  return <BottomNavStatic pathname={usePathname()} />;
}

export function SidebarNavStatic({ pathname = null }: { pathname?: string | null }) {
  return (
    <ul className="space-y-1">
      {modules.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-ink-3 text-paper" : "text-paper/60 hover:bg-ink-2 hover:text-paper"
              }`}
            >
              <Icon className={`size-4 ${active ? "text-accent" : ""}`} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BottomNavStatic({ pathname = null }: { pathname?: string | null }) {
  return (
    <ul className="grid grid-cols-5">
      {modules
        .filter((m) => m.mobile)
        .map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[0.65rem] ${active ? "text-accent" : "text-paper/60"}`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
    </ul>
  );
}
