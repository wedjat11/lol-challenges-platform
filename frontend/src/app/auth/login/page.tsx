"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "El email es obligatorio";
    if (!formData.password) newErrors.password = "La contraseña es obligatoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      showToast("¡Bienvenido de vuelta!", "success");
      router.push("/app/dashboard");
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Error al iniciar sesión";
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-150"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span className="font-syne font-bold text-[#C89B3C] tracking-widest text-sm">
            LOL·RETOS
          </span>
        </Link>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_420px] gap-16 items-center">

          {/* Left — editorial (desktop only) */}
          <div className="hidden lg:flex flex-col gap-6">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] font-inter">
              Acceso
            </p>
            <h1
              className="font-syne font-black text-[#F0F2F5] leading-none"
              style={{ fontSize: "clamp(3rem, 5vw, 5rem)" }}
            >
              Inicia
              <br />
              <span className="text-[#C89B3C]">sesión.</span>
            </h1>
            <p className="text-[#6B7280] text-base font-inter leading-relaxed max-w-xs">
              Accede a tus retos, acepta desafíos y valida resultados
              automáticamente con la API oficial de Riot.
            </p>
          </div>

          {/* Right — form card */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-8">

              {/* Mobile header */}
              <div className="lg:hidden mb-8">
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] font-inter mb-1.5">
                  Acceso
                </p>
                <h1 className="font-syne font-black text-[#F0F2F5] text-3xl leading-tight">
                  Inicia <span className="text-[#C89B3C]">sesión.</span>
                </h1>
              </div>

              {/* Desktop card header */}
              <div className="hidden lg:block mb-8">
                <p className="text-[#F0F2F5] font-inter font-medium text-sm">
                  Bienvenido de vuelta
                </p>
                <p className="text-[#6B7280] text-sm font-inter mt-1">
                  Ingresa tus credenciales para continuar.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  error={errors.email}
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={errors.password}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full mt-2"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>

                <div className="pt-4 border-t border-white/[0.06] text-center">
                  <p className="text-[#6B7280] text-sm font-inter">
                    ¿No tienes cuenta?{" "}
                    <Link
                      href="/auth/register"
                      className="text-[#C89B3C] hover:text-[#d4a94a] transition-colors"
                    >
                      Regístrate aquí
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
