"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface Stat {
  value: string;
  label: string;
  sublabel: string;
}

const STATS: Stat[] = [
  { value: "6", label: "tipos de retos", sublabel: "validados automáticamente" },
  { value: "100%", label: "validación automática", sublabel: "sin capturas de pantalla" },
  { value: "LA1", label: "región soportada", sublabel: "Latin America North" },
];

function CountUp({ value, active }: { value: string; active: boolean }) {
  const numericMatch = value.match(/^(\d+)/);
  const suffix = value.replace(/^\d+/, "");

  const [display, setDisplay] = useState(numericMatch ? "0" : value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current || !numericMatch) return;
    hasAnimated.current = true;
    const target = parseInt(numericMatch[1], 10);
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(String(Math.round(eased * target)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, numericMatch]);

  if (!numericMatch) return <>{value}</>;
  return (
    <>
      {display}
      {suffix}
    </>
  );
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <div id="stats" ref={ref} className="border-t border-b border-[#1C2333] bg-[#090C13]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#1C2333]">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: i * 0.12,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="flex flex-col items-center text-center px-4 sm:px-8 py-4 sm:py-0"
            >
              <span
                className="font-syne font-black tabular-nums text-[#F0F2F5] leading-none"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
              >
                <CountUp value={stat.value} active={inView && !prefersReducedMotion} />
              </span>
              <span className="mt-2 text-sm font-medium text-[#F0F2F5]/70 font-inter">
                {stat.label}
              </span>
              <span className="mt-0.5 text-xs text-[#374151] font-inter">{stat.sublabel}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
