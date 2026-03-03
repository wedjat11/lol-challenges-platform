"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLenis } from "./SmoothScroll";

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const NAV_VARIANTS = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.1 },
  },
} as const;

const MOBILE_VARIANTS = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18 } },
} as const;

// Nav links per CLAUDE.md §10
const NAV_LINKS = [
  { label: "Cómo funciona", anchor: "como-funciona" },
  { label: "Plantillas", anchor: "plantillas" },
  { label: "Empezar", anchor: "empezar" },
] as const;

// Sections tracked for active state (must match section IDs in each component)
const TRACKED_SECTIONS = ["hero", "stats", "como-funciona", "plantillas", "empezar"] as const;
type SectionId = (typeof TRACKED_SECTIONS)[number];

const EASING = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function Navbar({ isAuthenticated = false, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const prefersReducedMotion = useReducedMotion();
  const lenis = useLenis();

  // Solid navbar background on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section detection via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    TRACKED_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.35 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  // Smooth scroll to section via Lenis (falls back to native if Lenis not ready)
  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setIsOpen(false);
    const target = document.getElementById(sectionId);
    if (!target) return;

    if (lenis) {
      lenis.scrollTo(target, {
        offset: -56,
        duration: 1.4,
        easing: EASING,
      });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isActive = (ids: SectionId[]) => ids.includes(activeSection);

  const linkClass = (active: boolean) =>
    [
      "relative text-sm transition-colors duration-200",
      active ? "text-[#C89B3C]" : "text-[#6B7280] hover:text-[#F0F2F5]",
    ].join(" ");

  return (
    <motion.header
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      variants={NAV_VARIANTS}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: scrolled ? "rgba(8, 11, 17, 0.92)" : "transparent",
        borderBottom: scrolled ? "1px solid #1C2333" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        transition:
          "background-color 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={(e) => handleNavClick(e as unknown as React.MouseEvent, "hero")}
          className="font-syne font-bold text-[#C89B3C] tracking-widest text-base select-none"
        >
          LOL·RETOS
        </button>

        {/* Desktop center nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, anchor }) => (
            <a
              key={anchor}
              href={`#${anchor}`}
              onClick={(e) => handleNavClick(e, anchor)}
              className={linkClass(isActive([anchor as SectionId]))}
            >
              {label}
              {isActive([anchor as SectionId]) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#C89B3C]"
                />
              )}
            </a>
          ))}
        </nav>

        {/* Desktop right CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/app/dashboard"
                className="text-sm text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-200 px-3 py-1.5"
              >
                Dashboard
              </Link>
              <button
                onClick={onLogout}
                className="text-sm text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-200 px-3 py-1.5"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-200 px-3 py-1.5"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium text-[#C89B3C] border border-[#C89B3C]/60 px-4 py-1.5 rounded-md
                           hover:bg-[#C89B3C]/10 hover:border-[#C89B3C] transition-all duration-200 tracking-wide"
              >
                Comenzar
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#6B7280] hover:text-[#F0F2F5] transition-colors p-1"
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            exit={prefersReducedMotion ? undefined : "exit"}
            variants={MOBILE_VARIANTS}
            className="md:hidden border-t border-[#1C2333] bg-[#080B11]/95 backdrop-blur-md"
          >
            <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ label, anchor }) => (
                <a
                  key={anchor}
                  href={`#${anchor}`}
                  onClick={(e) => handleNavClick(e, anchor)}
                  className={[linkClass(isActive([anchor as SectionId])), "py-2.5"].join(" ")}
                >
                  {label}
                </a>
              ))}
              <div className="border-t border-[#1C2333] mt-2 pt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/app/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="text-sm text-[#6B7280] hover:text-[#F0F2F5] transition-colors py-2"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onLogout?.();
                      }}
                      className="text-sm text-left text-[#6B7280] hover:text-[#F0F2F5] transition-colors py-2"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="text-sm text-[#6B7280] hover:text-[#F0F2F5] transition-colors py-2"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setIsOpen(false)}
                      className="text-sm font-medium text-[#C89B3C] border border-[#C89B3C]/60 px-4 py-2 rounded-md
                                 hover:bg-[#C89B3C]/10 text-center mt-1 transition-all duration-200"
                    >
                      Comenzar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
