"use client";

import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The one orchestrated moment in Everline: on arrival the cover photograph
 * develops out of the dark and the name settles into place.
 */
export function HeroPhoto({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.06, filter: "blur(6px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 2.4, ease }}
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
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.35 + delay, ease }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
