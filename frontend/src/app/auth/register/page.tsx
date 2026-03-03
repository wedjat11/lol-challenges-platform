"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showRiotAccount, setShowRiotAccount] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    passwordConfirm: "",
    riotGameName: "",
    riotTagLine: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Formato de email inválido";

    if (!formData.username) newErrors.username = "El usuario es obligatorio";
    else if (formData.username.length < 3)
      newErrors.username = "Mínimo 3 caracteres";

    if (!formData.password) newErrors.password = "La contraseña es obligatoria";
    else if (formData.password.length < 8)
      newErrors.password = "Mínimo 8 caracteres";

    if (!formData.passwordConfirm)
      newErrors.passwordConfirm = "Confirma tu contraseña";
    else if (formData.password !== formData.passwordConfirm)
      newErrors.passwordConfirm = "Las contraseñas no coinciden";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const riotFields =
        showRiotAccount && formData.riotGameName
          ? { gameName: formData.riotGameName, tagLine: formData.riotTagLine }
          : {};

      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        ...riotFields,
      });

      showToast("¡Cuenta creada exitosamente!", "success");
      router.push("/onboarding/link-account");
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Error al registrarse";
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
              Nueva cuenta
            </p>
            <h1
              className="font-syne font-black text-[#F0F2F5] leading-none"
              style={{ fontSize: "clamp(3rem, 5vw, 5rem)" }}
            >
              Crea tu
              <br />
              <span className="text-[#C89B3C]">cuenta.</span>
            </h1>
            <p className="text-[#6B7280] text-base font-inter leading-relaxed max-w-xs">
              Únete, vincula tu cuenta de League of Legends y empieza a
              retar a otros jugadores.
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
                  Nueva cuenta
                </p>
                <h1 className="font-syne font-black text-[#F0F2F5] text-3xl leading-tight">
                  Crea tu <span className="text-[#C89B3C]">cuenta.</span>
                </h1>
              </div>

              {/* Desktop card header */}
              <div className="hidden lg:block mb-8">
                <p className="text-[#F0F2F5] font-inter font-medium text-sm">
                  Registro
                </p>
                <p className="text-[#6B7280] text-sm font-inter mt-1">
                  Completa los datos para crear tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  label="Usuario"
                  type="text"
                  placeholder="tu_usuario"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  error={errors.username}
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={errors.password}
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.passwordConfirm}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passwordConfirm: e.target.value,
                    })
                  }
                  error={errors.passwordConfirm}
                />

                {/* Optional Riot account */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowRiotAccount(!showRiotAccount)}
                    className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-150 font-inter"
                  >
                    {showRiotAccount ? (
                      <ChevronUp size={14} strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={14} strokeWidth={1.5} />
                    )}
                    {showRiotAccount
                      ? "Ocultar cuenta de LoL"
                      : "Vincular cuenta de LoL (opcional)"}
                  </button>

                  {showRiotAccount && (
                    <div className="mt-3">
                      <Input
                        label="Cuenta de LoL"
                        type="text"
                        placeholder="NOMBRE#TAG (ej: TOTO#LAN)"
                        value={
                          formData.riotTagLine
                            ? `${formData.riotGameName}#${formData.riotTagLine}`
                            : formData.riotGameName
                        }
                        onChange={(e) => {
                          const parts = e.target.value.split("#");
                          setFormData({
                            ...formData,
                            riotGameName: parts[0] ?? "",
                            riotTagLine: parts[1] ?? "",
                          });
                        }}
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full mt-2"
                >
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>

                <div className="pt-4 border-t border-white/[0.06] text-center">
                  <p className="text-[#6B7280] text-sm font-inter">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                      href="/auth/login"
                      className="text-[#C89B3C] hover:text-[#d4a94a] transition-colors"
                    >
                      Inicia sesión
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
