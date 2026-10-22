import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";

export function AuthShell({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="grain relative hidden overflow-hidden bg-night lg:block">
        <Image
          src="/demo/sandsend-1959.jpg"
          alt=""
          fill
          priority
          sizes="45vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-night/90 to-transparent p-10 pt-32 text-night-ink">
          <p className="max-w-sm font-serif text-lede italic leading-snug" style={{ fontVariationSettings: '"opsz" 30' }}>
            &ldquo;Every summer Dad shut the shop for one Saturday and we walked the beach to Sandsend and back.&rdquo;
          </p>
          <p className="mt-3 text-small text-night-soft">Peggy Ellison, aged 8, from the example story</p>
        </div>
      </aside>
      <main id="main" className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Link href="/" className="self-start rounded-sm text-ink" aria-label="Everline home">
          <Wordmark />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="text-h2">{title}</h1>
          {intro ? <div className="mt-3 text-body text-ink-soft">{intro}</div> : null}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
