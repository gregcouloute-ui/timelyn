import { cn } from "@/lib/cn";

/** Points on the lifeline. Gold marks a milestone; filled marks a moment with pictures. */
export function MomentMarker({ milestone, filled, className }: { milestone?: boolean; filled?: boolean; className?: string }) {
  if (milestone) {
    return (
      <span aria-hidden="true" className={cn("block size-3.5 rotate-45 border-2 border-paper bg-gold outline outline-1 outline-gold", className)} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block size-3 rounded-full border-[1.5px] border-cyan ring-4 ring-paper",
        filled ? "bg-cyan" : "bg-paper",
        className,
      )}
    />
  );
}

export const markerPosition = "absolute left-[-1.5rem] top-[0.5rem] -translate-x-1/2 lg:left-[-1.25rem]";
