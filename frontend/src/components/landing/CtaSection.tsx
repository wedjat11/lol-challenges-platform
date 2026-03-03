"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { RevealText } from "@/components/ui/RevealText";

interface CtaSectionProps {
  isAuthenticated: boolean;
}

export function CtaSection({ isAuthenticated }: CtaSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="empezar" className="py-24 md:py-40 bg-[#080B11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">

        {/* Section label */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] mb-8 md:mb-12"
        >
          Empezar
        </motion.p>

        {/* Headline — hero scale, Darkroom style */}
        <RevealText delay={0.1}>
          <h2
            className="font-syne font-black text-[#F0F2F5] leading-none mb-10 md:mb-14"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
          >
            ¿Listo para{" "}
            <span className="text-[#C89B3C]">probarte?</span>
          </h2>
        </RevealText>

        {/* Divider + copy + CTA in a row — editorial layout */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-end gap-8 pt-8 border-t border-[#1C2333]"
        >
          <p className="flex-1 text-sm text-[#6B7280] max-w-sm leading-relaxed font-inter">
            Únete y empieza a retar a otros jugadores de League of Legends hoy mismo.
            Registro gratuito, sin compromiso.
          </p>

          {!isAuthenticated && (
            <Link
              href="/auth/register"
              className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2
                         font-medium text-sm text-[#C89B3C] border border-[#C89B3C]/60
                         px-6 py-3 rounded-md tracking-wide min-h-[44px]
                         hover:bg-[#C89B3C]/10 hover:border-[#C89B3C] transition-all duration-200"
            >
              Crear mi cuenta <span aria-hidden>→</span>
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/app/dashboard"
              className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2
                         font-medium text-sm text-[#C89B3C] border border-[#C89B3C]/60
                         px-6 py-3 rounded-md tracking-wide min-h-[44px]
                         hover:bg-[#C89B3C]/10 hover:border-[#C89B3C] transition-all duration-200"
            >
              Ir al dashboard <span aria-hidden>→</span>
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
