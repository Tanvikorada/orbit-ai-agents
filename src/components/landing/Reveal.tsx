"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Fades content up as it enters the viewport, so each section arrives in reading order.
export function Reveal({
  children,
  delay = 0,
  className,
  onMount = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Animate immediately on load (hero) instead of on scroll. */
  onMount?: boolean;
}) {
  const reduce = useReducedMotion();
  const target = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      {...(onMount ? { animate: target } : { whileInView: target, viewport: { once: true, amount: 0.25 } })}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
