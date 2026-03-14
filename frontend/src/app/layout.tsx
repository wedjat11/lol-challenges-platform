import type { Metadata, Viewport } from "next";
import { Syne, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClientProvider } from "@/components/providers/QueryClientProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lolretos.com";

// ─── Fuentes ──────────────────────────────────────────────────────────────────
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",        // evita FOIT, mejora CLS
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

// ─── Metadata base (heredada por todas las páginas) ───────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // Template para sub-páginas: "Dashboard | LOL·RETOS"
  title: {
    default: "LOL·RETOS — Retos de League of Legends",
    template: "%s | LOL·RETOS",
  },
  description:
    "Crea y acepta retos personalizados de League of Legends. Validación 100% automática vía Riot API. Desafía a tus amigos y demuestra tu dominio en LATAM.",

  // ── Robots (páginas públicas) ─────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "es_MX",          // español México (base LATAM)
    alternateLocale: [
      "es_AR", "es_CO", "es_CL", "es_PE", "es_VE", "es_EC",
    ],
    siteName: "LOL·RETOS",
    url: SITE_URL,
    title: "LOL·RETOS — Retos de League of Legends",
    description:
      "Desafía a tus amigos en League of Legends con retos personalizados y validación automática con la API de Riot.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LOL·RETOS — Retos de League of Legends para Latinoamérica",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@lolretos",
    creator: "@lolretos",
    title: "LOL·RETOS — Retos de League of Legends",
    description:
      "Desafía a tus amigos en League of Legends con retos personalizados y validación automática con la API de Riot.",
    images: ["/opengraph-image"],
  },

  // ── Autores / Publisher ───────────────────────────────────────────────────
  authors: [{ name: "LOL·RETOS", url: SITE_URL }],
  creator: "LOL·RETOS",
  publisher: "LOL·RETOS",
  category: "gaming",

  // ── Verificación de Search Console ───────────────────────────────────────
  // Reemplaza el valor cuando configures Google Search Console:
  // verification: { google: "TU_CODIGO_DE_VERIFICACION" },

  // ── Otros ─────────────────────────────────────────────────────────────────
  applicationName: "LOL·RETOS",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
    "retos league of legends",
    "desafíos lol amigos",
    "plataforma retos lol",
    "league of legends challenges",
    "competir amigos lol",
    "retos gaming latinoamerica",
  ],
};

// ── Viewport separado (Next.js 14+ buena práctica) ────────────────────────────
export const viewport: Viewport = {
  themeColor: "#C89B3C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// ─── Layout ───────────────────────────────────────────────────────────────────
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="es" className={`${syne.variable} ${inter.variable}`}>
        <head>
          {/* Preconnect a fuentes y Riot API para mejorar LCP */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className="font-inter">
          <AuthProvider>
            <QueryClientProvider>
              <ToastProvider>
                {/* Barra de progreso de scroll (gold → blue) */}
                <ScrollProgress />
                {children}
              </ToastProvider>
            </QueryClientProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
