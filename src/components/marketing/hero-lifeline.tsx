"use client";

import { MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/cn";

interface Point {
  year: number;
  label: string;
  fill: string;
  milestone?: boolean;
  wide?: boolean;
}

const START = 1951;
const END = 2026;

const POINTS: Point[] = [
  { year: 1951, label: "Born in Whitby", fill: "bg-sun", milestone: true, wide: true },
  { year: 1967, label: "Art school", fill: "bg-mint" },
  { year: 1974, label: "Marries Walt", fill: "bg-sun", milestone: true, wide: true },
  { year: 1992, label: "Opens a bookshop", fill: "bg-coral" },
  { year: 2006, label: "Becomes Gran", fill: "bg-pink", wide: true },
  { year: 2019, label: "Sound of the sea", fill: "bg-lime" },
];

/**
 * A whole life as one thick line, from birth to today. On arrival the line
 * draws itself and the moments of a life drop onto it in order.
 */
export function HeroLifeline() {
  const pos = (year: number) => `${((year - START) / (END - START)) * 100}%`;
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative h-36" aria-hidden="true">
        <motion.div
          className="absolute inset-x-0 top-[2.43rem] h-[11px] origin-left border-y-[length:var(--line)] border-black bg-paper"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
        {POINTS.map((p, i) => (
          <motion.div
            key={p.year}
            className={cn("absolute top-0 flex -translate-x-1/2 flex-col items-center", !p.wide && "hidden md:flex")}
            style={{ left: pos(p.year) }}
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.7 + i * 0.18 }}
          >
            <p className="border-[length:var(--line-thin)] rounded-[var(--radius-pill)] border-black bg-black px-1.5 font-display text-small text-white">{p.year}</p>
            <span className={cn("marker mt-2 block", p.fill, p.milestone ? "size-6 rotate-45" : "size-6")} />
            <p className="mt-3 whitespace-nowrap border-[length:var(--line-thin)] rounded-[var(--radius-pill)] border-black bg-paper px-2 py-0.5 text-small font-bold">{p.label}</p>
          </motion.div>
        ))}
        <motion.div
          className="absolute left-full top-0 flex -translate-x-1/2 flex-col items-center"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 1.9 }}
        >
          <p className="border-[length:var(--line-thin)] rounded-[var(--radius-pill)] border-black bg-sun px-1.5 font-display text-small">TODAY</p>
          <span className="marker mt-2 block size-6 bg-paper-raised" />
        </motion.div>
      </div>
    </MotionConfig>
  );
}
