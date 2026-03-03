import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta gratis",
  description:
    "Regístrate gratis en LOL·RETOS y empieza a crear retos de League of Legends con tus amigos. Recibes monedas de bienvenida al registrarte.",
  keywords: [
    "registrarse league of legends retos",
    "crear cuenta lol retos",
    "registro plataforma lol",
  ],
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
