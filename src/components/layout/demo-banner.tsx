import { isDemo } from "@/lib/config";

/** Always visible in demo mode, so nothing simulated is mistaken for real. */
export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <aside aria-label="Demo mode" className="border-b border-gold/30 bg-gold-wash px-4 py-2 text-center text-small text-ink">
      <strong className="font-semibold">Demo mode.</strong> You&rsquo;re exploring a fictional family. Nothing is
      emailed or stored permanently, and changes reset when the server restarts.
    </aside>
  );
}
