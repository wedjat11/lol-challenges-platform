"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { useAnimationFrame } from "framer-motion";

// ─── Lenis context ────────────────────────────────────────────────────────────
export const LenisContext = createContext<Lenis | null>(null);

/** Access the Lenis instance from any client component. Returns null until mounted. */
export function useLenis() {
  return useContext(LenisContext);
}

// ─── Provider component ───────────────────────────────────────────────────────
interface SmoothScrollProps {
  children: React.ReactNode;
}

/**
 * Creates a single Lenis instance, provides it via LenisContext, and drives its
 * RAF tick through Framer Motion's animation loop so both share one rAF call.
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    setLenis(instance);
    return () => instance.destroy();
  }, []);

  // Shares Framer Motion's RAF — no double-rAF, no jank.
  useAnimationFrame((time) => {
    lenis?.raf(time);
  });

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
