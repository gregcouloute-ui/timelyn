import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 flex-col px-4 py-8 sm:px-8">
      <Link href="/" aria-label="TimeLyn home" className="self-start">
        <Wordmark />
      </Link>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-16">
        <h1 className="text-h1 uppercase">We can&rsquo;t find that page</h1>
        <p className="mt-4 text-body text-ink-soft">
          The link may be wrong, or the story isn&rsquo;t one you&rsquo;ve been invited to. Stories on TimeLyn are only
          visible to their members.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/stories">Your stories</ButtonLink>
          <ButtonLink href="/" variant="secondary">TimeLyn home</ButtonLink>
        </div>
      </div>
    </main>
  );
}
