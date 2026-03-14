import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#1C2333]">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="font-syne font-bold text-[#C89B3C] tracking-widest text-sm">
          LOL·RETOS
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-6">
          <a href="#how-it-works" className="text-xs text-[#6B7280] hover:text-[#F0F2F5] transition-colors">
            Cómo funciona
          </a>
          <a href="#templates" className="text-xs text-[#6B7280] hover:text-[#F0F2F5] transition-colors">
            Plantillas
          </a>
          <Link href="/auth/register" className="text-xs text-[#6B7280] hover:text-[#F0F2F5] transition-colors">
            Registrarse
          </Link>
        </nav>

        {/* Copyright + disclaimer */}
        <div className="flex flex-col items-center md:items-end gap-1">
          <p className="text-xs text-[#6B7280]">© 2026 LoL Retos</p>
          <p className="text-[10px] text-[#374151] text-center md:text-right">
            No afiliado ni aprobado por Riot Games. League of Legends es marca registrada de Riot Games, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
