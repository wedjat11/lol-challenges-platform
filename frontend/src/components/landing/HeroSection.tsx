"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ChallengePreviewCard } from "./ChallengePreviewCard";
import { useLenis } from "@/components/ui/SmoothScroll";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const lenis = useLenis();

  const { scrollY } = useScroll();
  const textY = useTransform(scrollY, [0, 500], [0, -30]);
  const cardY = useTransform(scrollY, [0, 500], [0, -80]);

  const fadeUp = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as const },
        };

  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("como-funciona");
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, {
        offset: -56,
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="min-h-screen flex items-center pt-14 bg-[#080B11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 w-full py-16 md:py-24">
        {/*
          Layout:
          < xl  (mobile/tablet/laptop): stack vertical — texto centrado, card debajo
          xl+  (1280px+):              grid 55/45  — texto izquierda, card derecha

          Por qué xl y no md:
          Con la grid de 2 col, la columna de texto mide ~55% del contenedor.
          El font-size de "cualquiera." en md-lg era demasiado ancho para esa
          columna (~378-520px) y el texto desbordaba empujando contenido abajo.
          A xl el contenedor es 1152px → 55% ≈ 590px, que sí soporta text-7xl.
        */}
        <div className="grid xl:grid-cols-[55%_45%] gap-12 xl:gap-10 items-center">

          {/* Text column */}
          <motion.div
            className="flex flex-col gap-6 text-center xl:text-left"
            style={prefersReducedMotion ? {} : { y: textY }}
          >
            {/* Tag line */}
            <motion.div
              {...fadeUp(0.2)}
              className="flex items-center gap-2 justify-center xl:justify-start"
            >
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C89B3C] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C89B3C]" />
              </span>
              <span className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] font-inter">
                Validación automática · League of Legends
              </span>
            </motion.div>

            {/*
              Tipografía hero — escalada con clases Tailwind, sin clamp con vw.
              El clamp(N, 10vw, M) fue el origen del bug: usa el ancho del
              VIEWPORT, no del contenedor, dando valores inesperados dentro de
              la grid. Tailwind breakpoints son más predecibles.

              "Reta a":       text-4xl → text-5xl (sm) — jerarquía secundaria
              "cualquiera.":  text-5xl → text-6xl (sm) → text-7xl (md)
                              A xl en col 55% (~590px): text-7xl(72px), 11 chars
                              × ~0.65em ≈ 515px < 590px → cabe sin overflow.
            */}
            <div>
              <motion.h1
                {...fadeUp(0.3)}
                className="font-syne font-black leading-none text-[#6B7280]
                           text-4xl sm:text-5xl"
              >
                Reta a
              </motion.h1>
              <motion.h1
                {...fadeUp(0.45)}
                className="font-syne font-black leading-none text-[#F0F2F5]
                           text-5xl sm:text-6xl md:text-7xl"
              >
                cual<span className="text-[#C89B3C]">quiera.</span>
              </motion.h1>
            </div>

            {/* Subtitle */}
            <motion.p
              {...fadeUp(0.65)}
              className="text-base sm:text-lg text-[#6B7280] max-w-md mx-auto xl:mx-0 leading-relaxed font-inter"
            >
              Crea retos personalizados, acepta desafíos y valida resultados
              automáticamente con la API oficial de Riot.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(0.85)}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center xl:justify-start"
            >
              <Link
                href={isAuthenticated ? "/app/dashboard" : "/auth/register"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                           font-medium text-sm text-[#C89B3C] border border-[#C89B3C]/60
                           px-6 py-3 rounded-md tracking-wide min-h-[44px]
                           hover:bg-[#C89B3C]/10 hover:border-[#C89B3C] transition-all duration-200"
              >
                {isAuthenticated ? "Ir al dashboard" : "Empezar ahora"}{" "}
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#como-funciona"
                onClick={handleScrollDown}
                className="text-sm text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-200
                           flex items-center gap-1.5 min-h-[44px]"
              >
                Ver cómo funciona <span aria-hidden>↓</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Card column
              < xl: segundo elemento en DOM → apila debajo del texto, centrado
              xl+:  columna derecha del grid
          */}
          <motion.div
            className="flex justify-center xl:justify-end"
            style={prefersReducedMotion ? {} : { y: cardY }}
          >
            <motion.div
              {...fadeUp(0.6)}
              className="w-full max-w-sm"
            >
              <ChallengePreviewCard />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
