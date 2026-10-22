import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/session";

/** Header for public pages. Sits on the dark documentary surfaces. */
export async function SiteHeader() {
  const viewer = await getViewer();
  return (
    <header className="relative z-10 bg-night text-night-ink">
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between gap-6 px-4 sm:px-8">
        <Link href="/" className="rounded-sm" aria-label="Everline home">
          <Wordmark className="[&_svg]:text-[#94b8d9]" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5 sm:gap-7">
          <Link href="/example" className="hidden text-ui text-night-soft hover:text-night-ink sm:inline">
            See an example
          </Link>
          {viewer ? (
            <ButtonLink href="/stories" variant="onNight" size="sm">
              Your stories
            </ButtonLink>
          ) : (
            <>
              <Link href="/sign-in" className="text-ui text-night-soft hover:text-night-ink">
                Sign in
              </Link>
              <ButtonLink href="/sign-up" variant="onNight" size="sm">
                Start a story
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
