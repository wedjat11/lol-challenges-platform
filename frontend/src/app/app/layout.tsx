import type { Metadata } from "next";
import { AppLayout } from "@/components/features/AppLayout";

// Las rutas /app/* requieren autenticación — no deben indexarse
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
