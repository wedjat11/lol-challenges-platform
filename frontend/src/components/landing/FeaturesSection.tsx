"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Swords, UserCheck, Zap } from "lucide-react";
import { RevealText } from "@/components/ui/RevealText";

const STEPS = [
  {
    number: "01",
    Icon: Swords,
    title: "Elige un reto",
    description:
      "Escoge entre 6 tipos de retos basados en la API de Riot. Define los parámetros y envíaselo a tu rival.",
  },
  {
    number: "02",
    Icon: UserCheck,
    title: "Tu rival lo acepta",
    description:
      "El jugador objetivo recibe el reto y decide si acepta el desafío. Al aceptar, el contador empieza.",
  },
  {
    number: "03",
    Icon: Zap,
    title: "Se valida solo",
    description:
      "Nuestro worker consulta la API de Riot cada vez que solicitas validación. Sin capturas de pantalla, sin trampa.",
  },
];

export function FeaturesSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="como-funciona" className="py-24 md:py-40 bg-[#080B11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">

        {/* Title */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-20 md:mb-28"
        >
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] mb-4">Cómo funciona</p>
          <RevealText delay={0.1}>
            <h2
              className="font-syne font-black text-[#F0F2F5] leading-none"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Simple. Automático.
              <br />
              <span className="text-[#C89B3C]">Definitivo.</span>
            </h2>
          </RevealText>
        </motion.div>

        {/* Steps grid — 1 col mobile, 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {STEPS.map(({ number, Icon, title, description }, i) => (
            <motion.div
              key={number}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={
                prefersReducedMotion ? {} : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
              }
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                opacity: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] },
                y: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] },
              }}
              className={[
                "relative group cursor-default px-0 py-10 md:px-8 md:py-0",
                "border-b md:border-b-0 border-[#1C2333]",
                i < STEPS.length - 1 ? "md:border-r border-[#1C2333]" : "",
              ].join(" ")}
            >
              {/* Large background number — desktop only (would clutter mobile) */}
              <span
                className="hidden md:block absolute top-0 right-4 font-syne font-black
                           text-[#F0F2F5] select-none pointer-events-none
                           opacity-[0.04] group-hover:opacity-[0.1] transition-opacity duration-300"
                style={{ fontSize: "clamp(6rem, 10vw, 10rem)", lineHeight: 1 }}
                aria-hidden
              >
                {number}
              </span>

              <div className="relative">
                {/* Step indicator on mobile */}
                <span className="md:hidden text-[10px] tracking-[0.2em] text-[#374151] font-syne font-bold mb-4 block">
                  PASO {number}
                </span>

                {/* Icon */}
                <div
                  className="mb-5 inline-flex items-center justify-center w-10 h-10 rounded-lg
                             border border-[#1C2333] bg-[#0D1117]
                             group-hover:border-[#C89B3C]/40 transition-colors duration-300"
                >
                  <Icon size={18} className="text-[#C89B3C]" strokeWidth={1.5} />
                </div>

                <h3 className="font-syne font-bold text-lg text-[#F0F2F5] mb-3">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed font-inter">{description}</p>
              </div>

              {/* Hover right border highlight — desktop only */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block absolute top-0 bottom-0 right-0 w-px
                             bg-[#1C2333] group-hover:bg-[#C89B3C]/20 transition-colors duration-300"
                  aria-hidden
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
