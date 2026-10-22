import { isDemo } from "@/lib/config";

/** Always visible in demo mode, so nothing simulated is mistaken for real. */
export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <aside aria-label="Demo mode" className="border-b-[3px] border-black bg-sun px-4 py-2 text-center text-small text-black">
      <strong className="font-bold">Demo mode.</strong> You&rsquo;re exploring a fictional family. Nothing is emailed or
      stored permanently, and changes reset when the server restarts.
    </aside>
  );
}
