"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { Trophy, Sword, Zap, Flame, Users, Shield } from "lucide-react";

interface ChallengeCard {
  number: string;
  name: string;
  description: string;
  tag: "Acumulado" | "Una partida";
  example: string;
  Icon: React.ElementType;
}

const CHALLENGE_CARDS: ChallengeCard[] = [
  {
    number: "01",
    name: "Victorias libres",
    description: "Gana X partidas con cualquier campeón en cualquier rol.",
    tag: "Acumulado",
    example: "Ej. 3 victorias en 7 días",
    Icon: Trophy,
  },
  {
    number: "02",
    name: "Maestro del campeón",
    description: "Demuestra que dominas un campeón específico ganando con él.",
    tag: "Acumulado",
    example: "Ej. Gana 5 partidas con Jinx",
    Icon: Sword,
  },
  {
    number: "03",
    name: "Máquina de kills",
    description: "Acumula el mayor número de eliminaciones en N partidas.",
    tag: "Acumulado",
    example: "Ej. 50 kills en 10 partidas",
    Icon: Zap,
  },
  {
    number: "04",
    name: "Partida perfecta",
    description: "Consigue X kills en una sola partida. Sin red de seguridad.",
    tag: "Una partida",
    example: "Ej. 20 kills en 1 partida",
    Icon: Flame,
  },
  {
    number: "05",
    name: "Soporte élite",
    description: "Acumula asistencias. El jugador de equipo definitivo.",
    tag: "Acumulado",
    example: "Ej. 80 asistencias en 15 partidas",
    Icon: Users,
  },
  {
    number: "06",
    name: "Carry silencioso",
    description: "X asistencias en una sola partida. Liderazgo sin protagonismo.",
    tag: "Una partida",
    example: "Ej. 20 asistencias en 1 partida",
    Icon: Shield,
  },
];

function ProgressDot({
  index,
  total,
  progress,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const mid = (index + 0.5) / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, mid, end], [0.25, 1, 0.25]);
  const scale = useTransform(progress, [start, mid, end], [0.75, 1, 0.75]);

  return (
    <motion.div
      style={{ opacity, scale }}
      className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]"
    />
  );
}

function HorizontalCard({ card }: { card: ChallengeCard }) {
  const { Icon } = card;
  return (
    <div
      className="flex-shrink-0 relative overflow-hidden rounded-lg
                 bg-[#0D1117] border border-[#1C2333]
                 hover:border-[#2D3748] transition-colors duration-300
                 flex flex-col justify-end
                 w-[85vw] md:w-[60vw] lg:w-[35vw]
                 h-[60vh] md:h-[65vh] lg:h-[70vh]"
    >
      {/* Large faded number — per CLAUDE.md: text-[12rem] font-black Syne, top-right */}
      <span
        className="absolute top-0 right-4 font-syne font-black text-[#1C2333] select-none pointer-events-none"
        style={{ fontSize: "clamp(6rem, 15vw, 12rem)", lineHeight: 1 }}
        aria-hidden
      >
        {card.number}
      </span>

      {/* Content pinned to bottom */}
      <div className="relative p-6 md:p-8 lg:p-10">
        {/* Icon */}
        <div
          className="mb-5 inline-flex items-center justify-center w-10 h-10 rounded-lg
                     border border-[#1C2333] bg-[#080B11]"
        >
          <Icon size={18} className="text-[#C89B3C]" strokeWidth={1.5} />
        </div>

        {/* Tag pill — gold for Acumulado, blue for Una partida */}
        <div className="mb-4">
          <span
            className={[
              "text-[10px] font-medium tracking-widest uppercase border rounded-full px-2.5 py-0.5",
              card.tag === "Acumulado"
                ? "border-[#C89B3C] text-[#C89B3C]"
                : "border-[#3B82F6] text-[#3B82F6]",
            ].join(" ")}
          >
            {card.tag}
          </span>
        </div>

        <h3
          className="font-syne font-black text-[#F0F2F5] leading-tight mb-2"
          style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)" }}
        >
          {card.name}
        </h3>
        <p className="text-sm text-[#6B7280] leading-relaxed font-inter mb-4">
          {card.description}
        </p>
        <p className="text-[11px] tracking-widest uppercase text-[#374151] font-inter">
          {card.example}
        </p>
      </div>
    </div>
  );
}

// Fallback static grid for prefers-reduced-motion
function StaticGrid() {
  return (
    <section id="plantillas" className="py-24 md:py-40 bg-[#080B11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] mb-4">Plantillas</p>
        <h2
          className="font-syne font-black text-[#F0F2F5] leading-none mb-16"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          ¿Qué tipo de retos
          <br />
          <span className="text-[#C89B3C]">puedes crear?</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHALLENGE_CARDS.map((card) => {
            const { Icon } = card;
            return (
              <div
                key={card.number}
                className="relative bg-[#0D1117] border border-[#1C2333] rounded-lg p-5 overflow-hidden"
              >
                <span
                  className="absolute top-0 right-3 font-syne font-black text-[#1C2333] select-none"
                  style={{ fontSize: "5rem", lineHeight: 1 }}
                  aria-hidden
                >
                  {card.number}
                </span>
                <div className="relative">
                  <div className="mb-4 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#1C2333] bg-[#080B11]">
                    <Icon size={15} className="text-[#C89B3C]" strokeWidth={1.5} />
                  </div>
                  <div className="mb-3">
                    <span
                      className={[
                        "text-[10px] font-medium tracking-widest uppercase border rounded-full px-2.5 py-0.5",
                        card.tag === "Acumulado"
                          ? "border-[#C89B3C] text-[#C89B3C]"
                          : "border-[#3B82F6] text-[#3B82F6]",
                      ].join(" ")}
                    >
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="font-syne font-bold text-sm text-[#F0F2F5] mb-1.5">{card.name}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-inter">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HorizontalScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 6 cards: move -83.33% to expose all (each ~16.67% of total track)
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-83.33%"]);

  if (prefersReducedMotion) {
    return <StaticGrid />;
  }

  return (
    // Tall wrapper creates the vertical scroll space that drives horizontal motion
    // height: 600vh on desktop, 400vh on mobile (fewer scroll needed)
    <section
      ref={containerRef}
      id="plantillas"
      className="relative"
      style={{ height: "400vh" }}
    >
      <style>{`
        @media (min-width: 768px) {
          #plantillas { height: 600vh; }
        }
      `}</style>

      {/* Sticky container — stays fixed while user scrolls through the 400/600vh */}
      <div className="sticky top-0 h-screen overflow-hidden bg-[#080B11] flex items-center">

        {/* Section label — top left */}
        <div className="absolute top-6 sm:top-8 left-4 sm:left-8 md:left-10 z-10">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280]">Plantillas</p>
        </div>

        {/* Progress dots — bottom center */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {CHALLENGE_CARDS.map((_, i) => (
            <ProgressDot
              key={i}
              index={i}
              total={CHALLENGE_CARDS.length}
              progress={scrollYProgress}
            />
          ))}
        </div>

        {/* Horizontal track — will-change: transform per performance rules §13 */}
        <motion.div
          style={{ x, willChange: "transform" }}
          className="flex gap-4 md:gap-6 pl-[8vw] sm:pl-[10vw]"
        >
          {CHALLENGE_CARDS.map((card) => (
            <HorizontalCard key={card.number} card={card} />
          ))}
          {/* End padding spacer so last card isn't flush against right edge */}
          <div className="flex-shrink-0 w-[8vw] sm:w-[10vw]" aria-hidden />
        </motion.div>
      </div>
    </section>
  );
}
