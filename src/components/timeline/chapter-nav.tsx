"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface NavChapter {
  id: string;
  title: string;
  years: string;
}

/** Sticky chapter index. Highlights the chapter being read. */
export function ChapterNav({ chapters }: { chapters: NavChapter[] }) {
  const [active, setActive] = useState<string | null>(chapters[0]?.id ?? null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = chapters
      .map((c) => document.getElementById(`chapter-${c.id}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;
    let frame = 0;
    // The chapter being read is the last one whose top has passed the upper
    // third of the screen; above the first chapter, the first is current.
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = sections[0];
      for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
      setActive(current.id.replace("chapter-", ""));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [chapters]);

  useEffect(() => {
    // Keep the active chapter visible in the horizontal list without
    // scrolling the page itself.
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-chapter="${active}"]`);
    if (!list || !el) return;
    const left = el.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + el.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, left - 16), behavior: "smooth" });
    }
  }, [active]);

  if (chapters.length < 2) return null;

  return (
    <nav aria-label="Chapters" className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur-sm">
      <ul ref={listRef} className="mx-auto flex max-w-[90rem] gap-1 overflow-x-auto px-2 sm:px-6 [scrollbar-width:none]">
        {chapters.map((c) => {
          const isActive = active === c.id;
          return (
            <li key={c.id} data-chapter={c.id} className="shrink-0">
              <a
                href={`#chapter-${c.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex items-baseline gap-2 border-b-2 px-2.5 py-3 text-small transition-colors",
                  isActive ? "border-cyan text-ink" : "border-transparent text-ink-soft hover:text-ink",
                )}
              >
                <span className="font-medium">{c.title}</span>
                <span className="text-caption text-ink-faint numerals-oldstyle">{c.years}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
