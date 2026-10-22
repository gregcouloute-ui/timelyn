"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-24 sm:px-8">
      <h1 className="text-h2 display-case">Something went wrong on our side</h1>
      <p className="mt-4 text-body text-ink-soft">
        Nothing you were working on was lost from the story itself. Try again, and if it keeps happening, come back in a
        little while.
      </p>
      {error.digest ? <p className="mt-3 text-small text-ink-faint">Reference: {error.digest}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/stories" variant="secondary">Your stories</ButtonLink>
      </div>
    </main>
  );
}
