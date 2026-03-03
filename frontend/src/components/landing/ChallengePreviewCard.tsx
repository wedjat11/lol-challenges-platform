"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ChallengePreviewCard() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={
        prefersReducedMotion
          ? {}
          : {
              opacity: 1,
              scale: 1,
              y: [0, -8, 0],
            }
      }
      transition={
        prefersReducedMotion
          ? {}
          : {
              opacity: { duration: 0.6, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] },
              scale: { duration: 0.6, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] },
              y: {
                delay: 1.4,
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
      }
      className="relative w-full max-w-sm mx-auto"
      style={{
        boxShadow: "0 0 40px rgba(200, 155, 60, 0.08), 0 0 80px rgba(200, 155, 60, 0.04)",
      }}
    >
      <div
        className="rounded-xl border border-[#1C2333] bg-[#0D1117] overflow-hidden"
      >
        {/* Card header */}
        <div className="px-5 py-4 border-b border-[#1C2333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar A */}
            <div className="w-8 h-8 rounded-full bg-[#1C2333] border border-[#C89B3C]/30 flex items-center justify-center">
              <span className="text-xs font-syne font-bold text-[#C89B3C]">TK</span>
            </div>
            <span className="text-xs font-medium text-[#6B7280]">Toto#LAN</span>
          </div>

          {/* VS */}
          <span className="text-xs font-syne font-bold text-[#C89B3C] tracking-widest">VS</span>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#6B7280]">Miku#LA1</span>
            {/* Avatar B */}
            <div className="w-8 h-8 rounded-full bg-[#1C2333] border border-[#3B82F6]/30 flex items-center justify-center">
              <span className="text-xs font-syne font-bold text-[#3B82F6]">MK</span>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="px-5 py-4 space-y-4">
          {/* Challenge type */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-1">Tipo de reto</p>
            <p className="text-sm font-syne font-semibold text-[#F0F2F5]">Wins with Champion</p>
          </div>

          {/* Params */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#080B11] rounded-lg px-3 py-2.5 border border-[#1C2333]">
              <p className="text-[10px] text-[#6B7280] mb-0.5">Campeón</p>
              <p className="text-sm font-semibold text-[#F0F2F5]">Jinx</p>
            </div>
            <div className="bg-[#080B11] rounded-lg px-3 py-2.5 border border-[#1C2333]">
              <p className="text-[10px] text-[#6B7280] mb-0.5">Victorias</p>
              <p className="text-sm font-semibold text-[#F0F2F5]">3 partidas</p>
            </div>
          </div>

          {/* Reward */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-0.5">Recompensa</p>
              <p className="text-sm font-syne font-bold text-[#C89B3C]">+8 monedas</p>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-1.5 bg-[#080B11] border border-[#1C2333] rounded-full px-3 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3B82F6]" />
              </span>
              <span className="text-[10px] font-medium text-[#3B82F6] tracking-wide">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Card footer */}
        <div className="px-5 py-3 border-t border-[#1C2333]">
          <button
            disabled
            className="w-full text-sm text-[#6B7280]/50 border border-[#1C2333] rounded-lg py-2.5 font-medium cursor-not-allowed"
          >
            Verificar progreso
          </button>
        </div>
      </div>

      {/* Subtle glow rim */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(200,155,60,0.04) 0%, transparent 60%)",
        }}
      />
    </motion.div>
  );
}
