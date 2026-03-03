"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { HeroSection } from "./HeroSection";
import { StatsBar } from "./StatsBar";
import { FeaturesSection } from "./FeaturesSection";
import { HorizontalScroll } from "./HorizontalScroll";
import { CtaSection } from "./CtaSection";
import { SectionDivider } from "./SectionDivider";

// Section order per CLAUDE.md §9:
// Navbar → ScrollProgress → Hero → Divider → Stats → Divider → Features
// → Divider → HorizontalScroll → Divider → CTA → Footer
export function LandingPage() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#080B11]">
      <Navbar isAuthenticated={isAuthenticated} onLogout={logout} />

      <main id="main-content">
        {/* 1. Hero */}
        <HeroSection isAuthenticated={isAuthenticated} />

        {/* 2. Expanding line divider */}
        <SectionDivider variant="line" />

        {/* 3. Stats */}
        <StatsBar />

        {/* 4. Gradient fade */}
        <SectionDivider variant="gradient" fromColor="#090C13" toColor="#080B11" />

        {/* 5. Features / Cómo funciona */}
        <FeaturesSection />

        {/* 6. Expanding line divider */}
        <SectionDivider variant="line" />

        {/* 7. Horizontal scroll — plantillas (OBLIGATORIO per CLAUDE.md §6) */}
        <HorizontalScroll />

        {/* 8. Expanding line divider */}
        <SectionDivider variant="line" />

        {/* 9. CTA */}
        <CtaSection isAuthenticated={isAuthenticated} />
      </main>

      <Footer />
    </div>
  );
}
