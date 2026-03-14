"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#080B11] flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-150"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span className="font-syne font-bold text-[#C89B3C] tracking-widest text-sm">
            LOL·RETOS
          </span>
        </Link>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_auto] gap-16 items-center">

          {/* Left — editorial (desktop only) */}
          <div className="hidden lg:flex flex-col gap-6">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] font-inter">
              Nueva cuenta
            </p>
            <h1
              className="font-syne font-black text-[#F0F2F5] leading-none"
              style={{ fontSize: "clamp(3rem, 5vw, 5rem)" }}
            >
              Crea tu
              <br />
              <span className="text-[#C89B3C]">cuenta.</span>
            </h1>
            <p className="text-[#6B7280] text-base font-inter leading-relaxed max-w-xs">
              Únete, vincula tu cuenta de League of Legends y empieza a
              retar a otros jugadores.
            </p>
          </div>

          {/* Right — Clerk SignUp */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Mobile header */}
            <div className="lg:hidden mb-8 text-center">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] font-inter mb-1.5">
                Nueva cuenta
              </p>
              <h1 className="font-syne font-black text-[#F0F2F5] text-3xl leading-tight">
                Crea tu <span className="text-[#C89B3C]">cuenta.</span>
              </h1>
            </div>

            <SignUp
              appearance={{
                variables: {
                  colorPrimary: "#C89B3C",
                  colorBackground: "#0D1117",
                  colorInputBackground: "rgba(255,255,255,0.05)",
                  colorInputText: "#F0F2F5",
                  colorText: "#F0F2F5",
                  colorTextSecondary: "#6B7280",
                  colorNeutral: "#6B7280",
                  borderRadius: "10px",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                },
                elements: {
                  card: {
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "none",
                  },
                  headerTitle: {
                    color: "#F0F2F5",
                    fontFamily: "var(--font-syne), Syne, sans-serif",
                    fontWeight: 800,
                  },
                  headerSubtitle: { color: "#6B7280" },
                  socialButtonsBlockButton: {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F0F2F5",
                  },
                  dividerText: { color: "#6B7280" },
                  formFieldLabel: { color: "#6B7280" },
                  formFieldInput: {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F0F2F5",
                  },
                  formButtonPrimary: {
                    background: "#C89B3C",
                    color: "#080B11",
                    fontWeight: 600,
                  },
                  footerActionText: { color: "#6B7280" },
                  footerActionLink: { color: "#C89B3C" },
                  identityPreviewText: { color: "#F0F2F5" },
                  identityPreviewEditButtonIcon: { color: "#C89B3C" },
                },
              }}
              forceRedirectUrl="/onboarding/link-account"
              signInUrl="/auth/login"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
