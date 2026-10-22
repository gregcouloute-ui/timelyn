import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export function AuthShell({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden items-center justify-center border-r-[length:var(--line)] border-black bg-pop p-12 lg:flex">
        <figure className="relative w-full max-w-sm -rotate-2">
          <span aria-hidden="true" className="absolute -top-4 left-1/2 z-[1] h-7 w-24 -translate-x-1/2 rotate-3 border-[length:var(--line-thin)] border-black bg-sun/90" />
          <div className="brutal-lg bg-paper p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(var(--radius)*0.6)] border-[length:var(--line)] border-black">
              <Image src="/demo/sandsend-1959.jpg" alt="Low tide at Sandsend" fill priority sizes="24rem" className="object-cover" />
            </div>
            <figcaption className="px-1 pb-1 pt-4">
              <p className="text-body font-bold">
                &ldquo;Every summer Dad shut the shop for one Saturday and we walked the beach to Sandsend and back.&rdquo;
              </p>
              <p className="tag mt-3 bg-sun">Peggy, aged 8, from the example story</p>
            </figcaption>
          </div>
        </figure>
      </aside>
      <main id="main" className="dots flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-ink" aria-label="TimeLyn home">
            <Wordmark />
          </Link>
          <ThemeSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="brutal-lg bg-paper p-6 sm:p-8">
            <h1 className="text-h2 display-case">{title}</h1>
            {intro ? <div className="mt-3 text-body font-medium text-ink-soft">{intro}</div> : null}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
