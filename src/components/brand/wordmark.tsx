import { cn } from "@/lib/cn";

/** The TimeLyn mark: a thick lifeline ending in a square moment. */
export function LineMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 14" className={cn("h-[0.8em] w-auto", className)} aria-hidden="true">
      <path d="M0 7h17" stroke="currentColor" strokeWidth="3.5" />
      <rect x="17.75" y="1.75" width="10.5" height="10.5" fill="var(--pop)" stroke="currentColor" strokeWidth="3.5" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-[1.375rem] uppercase leading-none tracking-[-0.01em]", className)}>
      <LineMark />
      <span>TimeLyn</span>
    </span>
  );
}
