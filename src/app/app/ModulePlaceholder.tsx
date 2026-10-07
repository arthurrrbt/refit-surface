import type { ReactNode } from "react";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-b border-ink/10 bg-paper px-4 py-6 sm:px-8">
      <h1 className="font-display text-xl font-semibold sm:text-2xl">{title}</h1>
      {children && <p className="mt-1 text-sm text-ink/60">{children}</p>}
    </div>
  );
}

export function ModulePlaceholder({ title, description, phase }: { title: string; description: string; phase: string }) {
  return (
    <>
      <PageHeader title={title}>{description}</PageHeader>
      <div className="p-4 sm:p-8">
        <div className="rounded-sm border border-dashed border-ink/20 bg-paper p-8 text-sm text-ink/60">
          Module prévu en <strong className="text-ink">{phase}</strong> (voir docs/ROADMAP.md).
        </div>
      </div>
    </>
  );
}
