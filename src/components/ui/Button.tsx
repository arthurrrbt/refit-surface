import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "outline" | "ghost" | "dark";
type Size = "md" | "sm";

// Capitales espacées gardées sur les boutons (trait de la marque, comme « SURFACE » dans le logo)
const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-display font-semibold uppercase transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 py-3 text-xs tracking-[0.16em]",
  sm: "min-h-9 px-4 py-2 text-[11px] tracking-[0.14em]",
};

const variants: Record<Variant, string> = {
  primary: "bg-accent text-ink hover:bg-paper",
  outline: "border border-paper/25 text-paper hover:border-paper/60 hover:bg-paper/5",
  ghost: "text-paper/80 hover:text-paper",
  dark: "bg-ink text-paper hover:bg-ink-3",
};

export function buttonClass(variant: Variant = "primary", extra = "", size: Size = "md") {
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, className, size)} {...props} />;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, className, size)} {...props} />;
}
