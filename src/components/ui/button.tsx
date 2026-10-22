import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet" | "danger" | "onNight" | "loud" | "loudSun";
type Size = "md" | "sm" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold text-black select-none disabled:pointer-events-none disabled:opacity-50";

const boxed = "press";

const variants: Record<Variant, string> = {
  /** The main action on a screen. */
  primary: `${boxed} bg-pop`,
  secondary: `${boxed} bg-paper`,
  quiet: "text-cyan underline decoration-2 underline-offset-4 hover:bg-sun hover:text-black",
  danger: `${boxed} bg-coral`,
  /** Primary action on black surfaces. */
  onNight: `${boxed} bg-sun border-white [--press-shadow:3px_3px_0_#fff] [--press-shadow-hover:5px_5px_0_#fff]`,
  /** Hero calls to action: display face, upper case. */
  loud: `${boxed} bg-pop font-display! font-normal! display-case tracking-wide`,
  loudSun: `${boxed} bg-sun font-display! font-normal! display-case tracking-wide`,
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-3.5 text-small",
  md: "h-12 px-5 text-ui",
  lg: "h-14 px-7 text-body",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], variant === "quiet" ? "h-auto px-0" : sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; pending?: boolean };

export function Button({ variant = "primary", size = "md", className, pending, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClass(variant, size, className)}
    >
      {pending ? <Spinner /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode };

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4 animate-spin", className)} aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M14 8A6 6 0 0 0 8 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}
