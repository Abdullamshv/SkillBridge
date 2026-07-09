"use client";

import Link from "next/link";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-light",
  accent: "bg-accent text-white hover:bg-accent-dark",
  secondary: "border border-border bg-white text-ink hover:bg-brand-tint",
  ghost: "text-muted hover:text-ink",
} as const;

const SIZES = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-sm",
} as const;

type ButtonProps = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-full font-bold transition-colors disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
