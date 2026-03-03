import type { MetadataRoute } from "next";

/**
 * Web App Manifest — accesible en /manifest.webmanifest
 * Mejora la indexación y habilita "Añadir a pantalla de inicio".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LOL·RETOS — Retos de League of Legends",
    short_name: "LOL·RETOS",
    description:
      "Crea retos personalizados de League of Legends, desafía a tus amigos y valida resultados automáticamente.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080B11",
    theme_color: "#C89B3C",
    lang: "es",
    scope: "/",
    categories: ["games", "entertainment", "sports"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
