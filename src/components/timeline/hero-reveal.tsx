"use client";

import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** The one orchestrated arrival: the photograph drops into place, then the name. */
export function HeroPhoto({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: -24, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: 2 }}
        transition={{ type: "spring", stiffness: 160, damping: 16, delay: 0.15 }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}

export function HeroLine({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 + delay, ease }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
