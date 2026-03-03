"use client";

import { motion, useReducedMotion } from "framer-motion";

interface SectionDividerProps {
  /**
   * "line"     — a horizontal rule that expands left→right on scroll-into-view
   * "gradient" — a 120px tall fade between two bg colours (creates a "breath"
   *              effect between sections with different backgrounds)
   */
  variant?: "line" | "gradient";
  fromColor?: string;
  toColor?: string;
}

/**
 * Decorative transition element between landing sections.
 *
 * Variant A (line): use between Hero→Stats and Features→Templates.
 * Variant B (gradient): use between Stats→Features and Templates→CTA.
 */
export function SectionDivider({
  variant = "line",
  fromColor = "#080B11",
  toColor = "#090C13",
}: SectionDividerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (variant === "gradient") {
    return (
      <div
        aria-hidden
        style={{
          height: 120,
          background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
          pointerEvents: "none",
        }}
      />
    );
  }

  // Variant: expanding line
  return (
    <div className="px-5 md:px-8" aria-hidden>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={prefersReducedMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: [0.25, 0, 0, 1] }}
          style={{
            transformOrigin: "left",
            height: 1,
            backgroundColor: "#1C2333",
          }}
        />
      </div>
    </div>
  );
}
