import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
        <span className="accent-rule mt-6" />
        {children && <div className="mt-6 max-w-2xl leading-relaxed text-paper/70">{children}</div>}
      </div>
    </section>
  );
}

export function ComingSoon({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="rounded-sm border border-dashed border-line bg-ink-2 p-8 text-paper/60">{children}</div>
    </div>
  );
}
