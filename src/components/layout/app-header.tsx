import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import type { Viewer } from "@/lib/domain/types";
import { AccountMenu } from "./account-menu";

export function AppHeader({ viewer }: { viewer: Viewer }) {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-6 px-4 sm:px-8">
        <Link href="/stories" className="rounded-sm text-ink" aria-label="Your stories">
          <Wordmark />
        </Link>
        <AccountMenu name={viewer.displayName} email={viewer.email} />
      </div>
    </header>
  );
}
