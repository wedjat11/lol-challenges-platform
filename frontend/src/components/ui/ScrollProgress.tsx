"use client";

import { useScroll, useSpring, motion, useReducedMotion } from "framer-motion";

/**
 * Fixed 2px progress bar at top of viewport driven by scroll position.
 * Gradient: gold → blue. Hidden when prefers-reduced-motion.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        scaleX,
        transformOrigin: "left",
        background: "linear-gradient(90deg, #C89B3C 0%, #3B82F6 100%)",
        height: "2px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
