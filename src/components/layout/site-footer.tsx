import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-14 sm:grid-cols-[1fr_auto] sm:px-8">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm font-serif text-body italic text-ink-soft">Every life is a story worth keeping.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3 text-ui text-ink-soft sm:justify-end">
          <Link href="/example" className="hover:text-ink">See an example</Link>
          <Link href="/sign-up" className="hover:text-ink">Start a story</Link>
          <Link href="/sign-in" className="hover:text-ink">Sign in</Link>
        </nav>
        <p className="text-small text-ink-faint sm:col-span-2">© {new Date().getFullYear()} Everline. Family stories are private to the people invited to them.</p>
      </div>
    </footer>
  );
}
