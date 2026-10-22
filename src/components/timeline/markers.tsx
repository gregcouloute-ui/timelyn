import { cn } from "@/lib/cn";

/**
 * Points on the lifeline. A yellow diamond marks a milestone; a blue square
 * marks a moment with pictures; a white square, everything else.
 */
export function MomentMarker({ milestone, filled, className }: { milestone?: boolean; filled?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "marker block",
        milestone ? "size-[18px] rotate-45 bg-sun" : filled ? "size-4 bg-pop" : "size-4 bg-paper",
        className,
      )}
    />
  );
}

export const markerPosition = "absolute left-[-1.5rem] top-6 -translate-x-1/2 lg:left-[-1.25rem] z-[1]";
