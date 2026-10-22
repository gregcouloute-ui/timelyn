import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/session";

export async function SiteHeader() {
  const viewer = await getViewer();
  return (
    <header className="relative z-10 border-b-[3px] border-black bg-paper">
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between gap-6 px-4 sm:px-8">
        <Link href="/" aria-label="TimeLyn home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 sm:gap-6">
          <Link href="/example" className="hidden text-ui font-bold hover:bg-sun sm:inline">
            See an example
          </Link>
          {viewer ? (
            <ButtonLink href="/stories" size="sm">
              Your stories
            </ButtonLink>
          ) : (
            <>
              <Link href="/sign-in" className="whitespace-nowrap text-ui font-bold hover:bg-sun">
                Sign in
              </Link>
              <ButtonLink href="/sign-up" size="sm">
                Start a story
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
