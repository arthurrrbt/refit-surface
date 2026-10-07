import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "outline" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.18em] transition-colors disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-ink hover:bg-paper",
  outline: "border border-paper/30 text-paper hover:border-accent hover:text-accent",
  ghost: "text-paper/80 hover:text-accent",
  dark: "bg-ink text-paper hover:bg-ink-3",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
