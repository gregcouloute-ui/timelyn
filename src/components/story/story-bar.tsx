"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface Tab {
  href: string;
  label: string;
  count?: number;
  exact?: boolean;
}

export function StoryBar({ slug, name, tabs }: { slug: string; name: string; tabs: Tab[] }) {
  const pathname = usePathname();
  const isActive = (t: Tab) => (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`));
  return (
    <section aria-label="Story" className="bg-night text-night-ink">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pt-0">
        <Link href={`/s/${slug}`} className="truncate font-serif text-lede sm:py-4" style={{ fontVariationSettings: '"opsz" 30' }}>
          {name}
        </Link>
        <nav aria-label="Story" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-6 whitespace-nowrap">
            {tabs.map((t) => {
              const active = isActive(t);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 border-b-2 py-3.5 text-ui transition-colors sm:py-[1.15rem]",
                      active ? "border-night-ink text-night-ink" : "border-transparent text-night-soft hover:text-night-ink",
                    )}
                  >
                    {t.label}
                    {t.count ? (
                      <span className="rounded-full bg-gold px-1.5 py-px text-caption font-semibold leading-tight text-night numerals-tabular">
                        {t.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}
