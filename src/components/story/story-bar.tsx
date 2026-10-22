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
    <section aria-label="Story" className="border-b-[3px] border-black bg-black text-white">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href={`/s/${slug}`} className="truncate font-display text-lede uppercase hover:text-pop">
          {name}
        </Link>
        <nav aria-label="Story" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
          <ul className="flex gap-2 whitespace-nowrap">
            {tabs.map((t) => {
              const active = isActive(t);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 border-2 px-3 text-ui font-bold transition-colors",
                      active ? "border-white bg-pop text-black" : "border-transparent text-white hover:border-white",
                    )}
                  >
                    {t.label}
                    {t.count ? (
                      <span className="border-2 border-black bg-sun px-1.5 text-caption font-bold leading-tight text-black numerals-tabular">
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
