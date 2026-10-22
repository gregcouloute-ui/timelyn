"use client";

import { MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/cn";

interface Point {
  year: number;
  label: string;
  milestone?: boolean;
  wide?: boolean;
}

const START = 1951;
const END = 2026;

const POINTS: Point[] = [
  { year: 1951, label: "Born in Whitby", milestone: true, wide: true },
  { year: 1967, label: "Art school in Leeds" },
  { year: 1974, label: "Marries Walt", milestone: true, wide: true },
  { year: 1992, label: "Opens a bookshop" },
  { year: 2006, label: "Becomes Gran", wide: true },
  { year: 2019, label: "The sound of the sea" },
];

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * A whole life drawn as a single line, from birth to today. On arrival the
 * line draws itself and the moments of a life settle onto it in order.
 */
export function HeroLifeline() {
  const pos = (year: number) => `${((year - START) / (END - START)) * 100}%`;
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative h-28 sm:h-32" aria-hidden="true">
        <motion.div
          className="absolute inset-x-0 top-[2.85rem] h-px origin-left bg-night-soft/60"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.2, ease, delay: 0.6 }}
        />
        {POINTS.map((p, i) => (
          <motion.div
            key={p.year}
            className={cn("absolute top-0 -translate-x-1/2", !p.wide && "hidden md:block")}
            style={{ left: pos(p.year) }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.8 + i * 0.28 }}
          >
            <p className="text-center font-serif text-lede font-light text-night-ink numerals-oldstyle">{p.year}</p>
            <span
              className={cn(
                "mx-auto mt-2 block",
                p.milestone ? "size-3 rotate-45 bg-[#d4ae62]" : "size-2.5 rounded-full bg-[#94b8d9]",
              )}
            />
            <p className="mt-3 whitespace-nowrap text-center text-small text-night-soft">{p.label}</p>
          </motion.div>
        ))}
        <motion.div
          className="absolute top-0 left-full -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.6 }}
        >
          <p className="text-center font-serif text-lede font-light text-night-ink">Today</p>
          <span className="mx-auto mt-2 block size-3 rounded-full border-[1.5px] border-night-ink" />
        </motion.div>
      </div>
    </MotionConfig>
  );
}
