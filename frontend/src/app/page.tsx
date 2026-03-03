import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

// ─── Producción: configura NEXT_PUBLIC_SITE_URL en Railway ───────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lolretos.com";

// ─── Metadata específica de la landing ───────────────────────────────────────
export const metadata: Metadata = {
  // Título absoluto: no hereda el template para evitar "LOL·RETOS | LOL·RETOS"
  title: {
    absolute:
      "LOL·RETOS — Retos de League of Legends para Latinoamérica | Desafía a tus amigos",
  },
  description:
    "Crea y acepta retos personalizados de League of Legends. Validación 100% automática vía Riot API. Desafía a tus amigos, gana monedas y demuestra tu dominio. Gratis. LA1 · LA2 · NA.",
  keywords: [
    "retos league of legends",
    "desafíos lol",
    "retos lol amigos",
    "competir amigos league of legends",
    "plataforma retos lol",
    "league of legends challenges",
    "retos gaming lol",
    "desafios lol latinoamérica",
    "lol retos personalizados",
    "riot api validación",
    "retos kills lol",
    "challenges lol",
    "lol la1",
    "league of legends la1",
    "retos lol kills",
    "retos lol victorias",
    "desafio lol amigos",
    "juegos retos lol",
    "competicion league of legends",
    "retos gamer latinoamerica",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "LOL·RETOS — Retos de League of Legends para Latinoamérica",
    description:
      "Crea retos personalizados, reta a tus amigos y valida resultados automáticamente. La plataforma competitiva para jugadores de LoL en LATAM.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "LOL·RETOS — Retos de League of Legends para Latinoamérica",
      },
    ],
  },
  twitter: {
    title: "LOL·RETOS — Retos de League of Legends para Latinoamérica",
    description:
      "Crea retos personalizados, reta a tus amigos y valida resultados automáticamente con la API de Riot.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

// ─── JSON-LD: WebApplication schema ──────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LOL·RETOS",
  url: SITE_URL,
  description:
    "Plataforma de retos personalizados para jugadores de League of Legends con validación automática vía API de Riot Games.",
  applicationCategory: "GameApplication",
  operatingSystem: "Any (Web Browser)",
  browserRequirements: "Requires JavaScript. Requires a modern browser.",
  inLanguage: "es",
  availableLanguage: [
    { "@type": "Language", name: "Spanish" },
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: "LOL·RETOS",
    url: SITE_URL,
  },
  audience: {
    "@type": "Audience",
    audienceType: "League of Legends players in Latin America",
    geographicArea: { "@type": "GeoShape", name: "Latin America, North America" },
  },
  featureList: [
    "Retos personalizados de League of Legends",
    "Validación automática vía Riot Games API",
    "Sistema de monedas virtuales",
    "6 tipos de retos: kills, victorias, asistencias",
    "Soporte para LA1, LA2 y NA",
  ],
};

// ─── FAQ Schema — mejora rich snippets en SERP ───────────────────────────────
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Cómo funciona LOL·RETOS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Crea un reto personalizado, envíaselo a tu rival, él lo acepta y luego la plataforma valida automáticamente el resultado usando la API oficial de Riot Games. Sin capturas de pantalla, sin trampa.",
      },
    },
    {
      "@type": "Question",
      name: "¿Es gratis usar LOL·RETOS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, registrarse es completamente gratis. Recibes monedas virtuales al registrarte y puedes usarlas para crear retos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué tipos de retos puedo crear en League of Legends?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Puedes crear retos de victorias con campeón específico, kills acumuladas, asistencias en una partida, victorias libres, kills en una sola partida y asistencias acumuladas en N partidas.",
      },
    },
    {
      "@type": "Question",
      name: "¿Para qué regiones de LoL funciona?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LOL·RETOS funciona principalmente para LA1 (Latinoamérica Norte), con soporte también para otras regiones.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo se validan los retos automáticamente?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Usamos la API oficial de Riot Games para consultar el historial de partidas. Solo cuentan partidas jugadas después de que aceptaste el reto, y duradas más de 5 minutos.",
      },
    },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      {/* Structured data — leído por Googlebot antes del JS */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingPage />
    </>
  );
}
