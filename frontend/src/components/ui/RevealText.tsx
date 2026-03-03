"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface RevealTextProps {
  /** Content to clip-path reveal. Typically an h2/h3 element. */
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Wraps children in an overflow:hidden container and reveals them via
 * clip-path inset animation when they scroll into view.
 *
 * When prefers-reduced-motion is set, the content is shown immediately
 * without any animation.
 */
export function RevealText({ children, className, delay = 0 }: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div
        initial={prefersReducedMotion ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
        animate={
          inView
            ? prefersReducedMotion
              ? {}
              : { clipPath: "inset(0% 0% 0% 0%)" }
            : {}
        }
        transition={{ duration: 0.7, delay, ease: [0.76, 0, 0.24, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
