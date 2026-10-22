import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-black bg-paper">
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-12 sm:grid-cols-[1fr_auto] sm:px-8">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm text-body font-medium">Every life is a story worth keeping.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-ui font-bold sm:justify-end">
          <Link href="/example" className="hover:bg-sun">See an example</Link>
          <Link href="/sign-up" className="hover:bg-sun">Start a story</Link>
          <Link href="/sign-in" className="hover:bg-sun">Sign in</Link>
        </nav>
        <p className="text-small text-ink-faint sm:col-span-2">© {new Date().getFullYear()} TimeLyn. Family stories are private to the people invited to them.</p>
      </div>
    </footer>
  );
}
