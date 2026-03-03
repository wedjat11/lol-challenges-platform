import type { Metadata } from "next";

export const metadata: Metadata = {
  // Auth pages: permitir indexación solo para login/register
  // (son páginas de captación para usuarios sin cuenta)
  robots: {
    index: true,
    follow: false,
    googleBot: { index: true, follow: false },
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
