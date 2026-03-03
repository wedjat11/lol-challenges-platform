"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy, Sword, Handshake, Shield, Target, Layers } from "lucide-react";
import { RevealText } from "@/components/ui/RevealText";

interface Template {
  icon: React.ElementType;
  name: string;
  description: string;
  tag: "Acumulado" | "En una partida";
}

const TEMPLATES: Template[] = [
  {
    icon: Trophy,
    name: "Victorias con campeón",
    description: "Gana X partidas usando un campeón específico.",
    tag: "Acumulado",
  },
  {
    icon: Sword,
    name: "Kills acumuladas",
    description: "Consigue X kills en N partidas seguidas.",
    tag: "Acumulado",
  },
  {
    icon: Handshake,
    name: "Asistencias en una partida",
    description: "Logra X asistencias en un solo juego.",
    tag: "En una partida",
  },
  {
    icon: Shield,
    name: "Victorias libres",
    description: "Gana X partidas con cualquier campeón.",
    tag: "Acumulado",
  },
  {
    icon: Target,
    name: "Kills en una partida",
    description: "Consigue X kills en un solo juego.",
    tag: "En una partida",
  },
  {
    icon: Layers,
    name: "Asistencias acumuladas",
    description: "Suma X asistencias en N partidas.",
    tag: "Acumulado",
  },
];

export function TemplatesPreview() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="plantillas" className="py-24 md:py-36 bg-[#0A0E16]">
      <div className="max-w-6xl mx-auto px-5 md:px-8">

        {/* Title */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-12 md:mb-16"
        >
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] mb-4">Plantillas</p>
          <RevealText delay={0.1}>
            <h2 className="font-syne font-black text-4xl md:text-5xl text-[#F0F2F5] leading-tight">
              ¿Qué tipo de retos
              <br />
              <span className="text-[#C89B3C]">puedes crear?</span>
            </h2>
          </RevealText>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map(({ icon: Icon, name, description, tag }, i) => (
            <motion.div
              key={name}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                opacity: { duration: 0.55, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] },
                y: { duration: 0.55, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] },
              }}
              className="group relative bg-[#0D1117] border border-[#1C2333] rounded-xl p-5
                         hover:border-[#C89B3C]/30 cursor-default transition-colors duration-300"
            >
              {/* Icon */}
              <div
                className="mb-4 inline-flex items-center justify-center w-9 h-9 rounded-lg
                           border border-[#1C2333] bg-[#080B11]
                           group-hover:border-[#C89B3C]/30 transition-colors duration-300"
              >
                <Icon size={15} className="text-[#C89B3C]" strokeWidth={1.5} />
              </div>

              {/* Text */}
              <h3 className="font-syne font-semibold text-sm text-[#F0F2F5] mb-1.5">{name}</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed mb-4 font-inter">{description}</p>

              {/* Tag */}
              <span className="inline-flex text-[10px] font-medium tracking-wide text-[#6B7280] border border-[#1C2333] rounded-full px-2.5 py-0.5">
                {tag}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
