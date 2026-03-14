"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Swords, User, LogOut, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useApiChallenges";

// Nav items — Lucide icons, no emojis (CLAUDE.md §2)
const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/app/challenges", label: "Retos", Icon: Swords },
  { href: "/app/profile", label: "Perfil", Icon: User },
] as const;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, isAuthenticated, isLoading } = useAuth();
  const handleLogout = () => { void logout(); };
  const { data: balanceData } = useBalance();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const balance = balanceData?.balance ?? 0;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080B11]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border border-[#C89B3C] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#6B7280] text-sm font-inter">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080B11]">
        <div className="w-8 h-8 border border-[#C89B3C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080B11]">

      {/*
        ── Sidebar — desktop lg+ (240px) ──────────────────────────────────────
        CLAUDE.md §14: "Desktop (lg+): Sidebar fija de 240px"
        CLAUDE.md §11: bg rgba(8,11,17,0.8) + blur(24px) + border-right rgba(255,255,255,0.05)
      */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0
                   bg-[#080B11]/80 backdrop-blur-2xl border-r border-white/5"
      >
        {/* Logo */}
        <div className="px-5 h-16 flex items-center border-b border-white/5">
          <Link
            href="/app/dashboard"
            className="font-syne font-bold text-[#C89B3C] tracking-widest text-sm select-none"
          >
            LOL·RETOS
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-inter transition-colors duration-150",
                  active
                    ? "bg-white/[0.06] text-[#F0F2F5]"
                    : "text-[#6B7280] hover:bg-white/[0.04] hover:text-[#F0F2F5]",
                ].join(" ")}
              >
                <Icon
                  size={15}
                  strokeWidth={active ? 2 : 1.5}
                  className={active ? "text-[#C89B3C] flex-shrink-0" : "flex-shrink-0"}
                />
                <span className="flex-1">{label}</span>
                {active && (
                  <span className="w-1 h-4 rounded-full bg-[#C89B3C] flex-shrink-0" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Balance + logout */}
        <div className="px-3 pb-4 flex flex-col gap-2 border-t border-white/5 pt-3">
          {/* Balance pill */}
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                       bg-white/[0.03] border border-white/[0.06]"
          >
            <Coins size={13} className="text-[#C89B3C] flex-shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-[10px] text-[#6B7280] font-inter leading-none mb-0.5">Balance</p>
              <p className="text-sm font-bold font-syne text-[#C89B3C] tabular-nums leading-none">
                {balance}
                <span className="text-xs font-normal text-[#6B7280] ml-1">monedas</span>
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6B7280]
                       hover:bg-white/[0.04] hover:text-[#F0F2F5] transition-colors duration-150
                       font-inter w-full"
          >
            <LogOut size={15} strokeWidth={1.5} className="flex-shrink-0" />
            Salir
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/*
          Mobile top bar — visible < lg
          Shows logo + balance pill
        */}
        <header
          className="lg:hidden flex items-center justify-between px-4 h-14 flex-shrink-0
                     bg-[#080B11]/80 backdrop-blur-xl border-b border-white/5"
        >
          <span className="font-syne font-bold text-[#C89B3C] tracking-widest text-sm">
            LOL·RETOS
          </span>
          <div
            className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06]
                       rounded-full px-3 py-1.5"
          >
            <Coins size={12} className="text-[#C89B3C]" strokeWidth={1.5} />
            <span className="text-[#C89B3C] font-bold text-sm font-syne tabular-nums">
              {balance}
            </span>
          </div>
        </header>

        {/* Page content — scrollable, padded above bottom nav on mobile */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/*
        ── Bottom navigation — mobile < lg ──────────────────────────────────
        CLAUDE.md §14: "Sin sidebar — bottom navigation bar de 4 íconos"
        Height h-16, touch targets ≥ 44px per §14 responsive rules
      */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16
                   bg-[#080B11]/90 backdrop-blur-xl border-t border-white/5
                   flex items-center justify-around px-2"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg min-w-[56px] min-h-[44px] justify-center transition-colors duration-150",
                active ? "text-[#C89B3C]" : "text-[#6B7280] hover:text-[#F0F2F5]",
              ].join(" ")}
            >
              <Icon size={19} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-inter leading-none">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg min-w-[56px] min-h-[44px] justify-center
                     text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-150"
        >
          <LogOut size={19} strokeWidth={1.5} />
          <span className="text-[10px] font-inter leading-none">Salir</span>
        </button>
      </nav>
    </div>
  );
}
