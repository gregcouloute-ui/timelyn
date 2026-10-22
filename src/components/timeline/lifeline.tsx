"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * The line that runs through a life. As you read down the story it fills
 * with ink, so you always know how far through the life you are.
 */
export function Lifeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 55%", "end 55%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  return (
    <div ref={ref} className="relative [--line-x:0.75rem] lg:[--line-x:15.25rem]">
      <div aria-hidden="true" className="absolute bottom-0 top-0 left-[var(--line-x)] w-px -translate-x-1/2 bg-rule-strong" />
      <motion.div
        aria-hidden="true"
        style={{ scaleY: reduce ? scrollYProgress : smooth, transformOrigin: "top" }}
        className="absolute bottom-0 top-0 left-[var(--line-x)] w-[2px] -translate-x-1/2 bg-cyan"
      />
      {children}
    </div>
  );
}
