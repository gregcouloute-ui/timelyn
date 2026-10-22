import { cn } from "@/lib/cn";

/** The Everline mark: a short lifeline ending in an open point, then the name. */
export function LineMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 10" className={cn("h-[0.55em] w-auto", className)} aria-hidden="true">
      <path d="M0 5h17.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="21" cy="5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-serif text-[1.375rem] leading-none tracking-[-0.01em]", className)}>
      <LineMark className="text-cyan" />
      <span style={{ fontVariationSettings: '"opsz" 24' }} className="font-medium">
        Everline
      </span>
    </span>
  );
}
