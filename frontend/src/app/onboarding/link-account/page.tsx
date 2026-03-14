'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Search, X, AlertCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';

interface RiotLookupResult {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number | null;
}

function getProfileIconUrl(iconId: number | null): string | null {
  if (!iconId) return null;
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${iconId}.jpg`;
}

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
type RiotState = 'idle' | 'searching' | 'found' | 'not_found' | 'error';

export default function OnboardingPage() {
  const router = useRouter();
  const { setHasRiotAccount, refreshUser, user: backendUser } = useAuth();
  const { user: clerkUser } = useUser();
  const { showToast } = useToast();

  // Username
  const [username, setUsername] = useState('');
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // LoL search — single input
  const [searchQuery, setSearchQuery] = useState('');
  const [riotState, setRiotState] = useState<RiotState>('idle');
  const [riotResult, setRiotResult] = useState<RiotLookupResult | null>(null);
  const [selectedRiot, setSelectedRiot] = useState<RiotLookupResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const riotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill username from backend user (skip auto-generated ones)
  useEffect(() => {
    if (backendUser) {
      const current = backendUser.username as string | undefined;
      if (current && !/_.{6}$/.test(current)) {
        setUsername(current);
      }
    }
  }, [backendUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Debounced username check ──
  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value);
    setUsernameState('idle');
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    if (!value) return;
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      setUsernameState('invalid');
      return;
    }
    setUsernameState('checking');
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/users/check-username?username=${encodeURIComponent(value)}`);
        const data = res.data as { available: boolean };
        setUsernameState(data.available ? 'available' : 'taken');
      } catch {
        setUsernameState('idle');
      }
    }, 600);
  }, []);

  // ── Debounced Riot lookup — single query, #TAG optional ──
  const triggerRiotLookup = useCallback((query: string) => {
    if (riotTimerRef.current) clearTimeout(riotTimerRef.current);

    setSelectedRiot(null);
    setRiotResult(null);

    const trimmed = query.trim();
    // Extract the "name" part (before # if present) to check minimum length
    const namePart = trimmed.includes('#') ? trimmed.split('#')[0] ?? '' : trimmed;

    if (namePart.length < 2) {
      setRiotState('idle');
      setShowDropdown(false);
      return;
    }

    setRiotState('searching');
    setShowDropdown(true);

    riotTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/users/riot-lookup?q=${encodeURIComponent(trimmed)}`);
        setRiotResult(res.data as RiotLookupResult);
        setRiotState('found');
      } catch (err: unknown) {
        const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
        setRiotState(code === 'RIOT_NOT_FOUND' ? 'not_found' : 'error');
        setRiotResult(null);
      }
    }, 500);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    triggerRiotLookup(value);
  }, [triggerRiotLookup]);

  const selectRiotAccount = (account: RiotLookupResult) => {
    setSelectedRiot(account);
    setSearchQuery(`${account.gameName}#${account.tagLine}`);
    setShowDropdown(false);
    setRiotState('found');
  };

  const clearRiotSelection = () => {
    setSelectedRiot(null);
    setSearchQuery('');
    setRiotState('idle');
    setRiotResult(null);
    setShowDropdown(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const isFormReady = usernameState === 'available' && selectedRiot !== null;

  const handleSubmit = async () => {
    if (!isFormReady || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch('/users/me/username', { username });
      // region is NOT sent — DTO doesn't accept it
      await apiClient.post('/users/me/riot-account', {
        gameName: selectedRiot!.gameName,
        tagLine: selectedRiot!.tagLine,
      });
      await refreshUser();
      setHasRiotAccount(true);
      showToast('¡Todo listo! Bienvenido a LoL Retos', 'success');
      router.push('/app/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ocurrió un error. Intenta de nuevo.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName =
    clerkUser?.firstName ??
    clerkUser?.username ??
    clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] ??
    'Jugador';

  return (
    <div className="min-h-screen bg-[#080B11] flex flex-col">
      {/* Top bar */}
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

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-8">

            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] font-inter mb-1.5">
                Configura tu perfil
              </p>
              <h1 className="font-syne font-black text-[#F0F2F5] text-3xl leading-tight">
                Hola, <span className="text-[#C89B3C]">{displayName}.</span>
              </h1>
              <p className="text-[#6B7280] text-sm font-inter mt-3 leading-relaxed">
                Elige tu nombre en la app y vincula tu cuenta de LoL para empezar.
              </p>
            </div>

            <div className="flex flex-col gap-6">

              {/* ── Username ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#6B7280] font-inter font-medium">
                  Nombre de usuario en la app
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]">
                    <User size={15} strokeWidth={1.5} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="ej: Shadow_King"
                    maxLength={20}
                    className="w-full bg-white/[0.05] border rounded-lg pl-9 pr-10 py-3
                               text-sm text-[#F0F2F5] font-inter focus:outline-none
                               transition-colors duration-150 placeholder:text-[#374151]"
                    style={{
                      borderColor:
                        usernameState === 'available'
                          ? '#22c55e'
                          : usernameState === 'taken' || usernameState === 'invalid'
                          ? '#ef4444'
                          : 'rgba(255,255,255,0.1)',
                    }}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {usernameState === 'checking' && <Loader2 size={15} className="animate-spin text-[#6B7280]" />}
                    {usernameState === 'available' && <Check size={15} className="text-green-400" />}
                    {(usernameState === 'taken' || usernameState === 'invalid') && <AlertCircle size={15} className="text-red-400" />}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {usernameState === 'taken' && (
                    <motion.p key="taken" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs text-red-400 font-inter">
                      Ese nombre ya está en uso
                    </motion.p>
                  )}
                  {usernameState === 'invalid' && (
                    <motion.p key="invalid" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs text-red-400 font-inter">
                      3-20 caracteres: letras, números y guiones bajos
                    </motion.p>
                  )}
                  {usernameState === 'available' && (
                    <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs text-green-400 font-inter">
                      ¡Nombre disponible!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Riot account ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#6B7280] font-inter font-medium">
                  Cuenta de League of Legends
                </label>

                <AnimatePresence mode="wait">
                  {selectedRiot ? (
                    /* Verified pill */
                    <motion.div
                      key="selected"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="flex items-center justify-between px-4 py-3
                                 bg-green-500/10 border border-green-500/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getProfileIconUrl(selectedRiot.profileIconId) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getProfileIconUrl(selectedRiot.profileIconId)!}
                            alt=""
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-md object-cover flex-shrink-0 border border-white/[0.1]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#C89B3C]/20 border border-[#C89B3C]/40
                                          flex items-center justify-center flex-shrink-0">
                            <Check size={13} className="text-[#C89B3C]" strokeWidth={2.5} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-inter text-[#F0F2F5] font-medium leading-none">
                            {selectedRiot.gameName}
                            <span className="text-[#6B7280]">#{selectedRiot.tagLine}</span>
                          </p>
                          <p className="text-[11px] text-green-400 font-inter mt-0.5">
                            Cuenta verificada · LA1
                          </p>
                        </div>
                      </div>
                      <button onClick={clearRiotSelection}
                        className="text-[#6B7280] hover:text-[#F0F2F5] transition-colors p-1">
                        <X size={15} />
                      </button>
                    </motion.div>
                  ) : (
                    /* Search — single input */
                    <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="relative" ref={dropdownRef}>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">
                            {riotState === 'searching'
                              ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                              : <Search size={14} strokeWidth={1.5} />
                            }
                          </div>
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onFocus={() => { if (searchQuery.trim().length >= 2) setShowDropdown(true); }}
                            placeholder="Nombre de invocador (ej: Shadow o Shadow#LAN)"
                            autoComplete="off"
                            className="w-full bg-white/[0.05] border border-white/[0.1]
                                       rounded-lg pl-9 pr-4 py-3 text-sm text-[#F0F2F5] font-inter
                                       focus:outline-none focus:border-[#C89B3C] transition-colors
                                       placeholder:text-[#374151]"
                          />
                        </div>

                        <AnimatePresence>
                          {showDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-20 top-full left-0 right-0 mt-1.5
                                         bg-[#0D1117] border border-white/[0.1] rounded-lg
                                         overflow-hidden shadow-xl"
                            >
                              {riotState === 'searching' && (
                                <div className="px-4 py-3.5 flex items-center gap-2.5">
                                  <Loader2 size={14} className="animate-spin text-[#6B7280] flex-shrink-0" />
                                  <span className="text-sm text-[#6B7280] font-inter">Buscando en Riot Games…</span>
                                </div>
                              )}

                              {riotState === 'found' && riotResult && (
                                <button
                                  onClick={() => selectRiotAccount(riotResult)}
                                  className="w-full px-4 py-3 flex items-center gap-3
                                             hover:bg-white/[0.04] transition-colors text-left group"
                                >
                                  {getProfileIconUrl(riotResult.profileIconId) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={getProfileIconUrl(riotResult.profileIconId)!}
                                      alt=""
                                      width={36}
                                      height={36}
                                      className="w-9 h-9 rounded-md object-cover flex-shrink-0 border border-white/[0.08]"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-md bg-[#C89B3C]/15 border border-[#C89B3C]/30
                                                    flex items-center justify-center flex-shrink-0">
                                      <span className="text-[#C89B3C] text-sm font-syne font-bold">
                                        {riotResult.gameName.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-inter text-[#F0F2F5] font-medium truncate">
                                      {riotResult.gameName}
                                      <span className="text-[#6B7280]">#{riotResult.tagLine}</span>
                                    </p>
                                    <p className="text-[11px] text-[#6B7280] font-inter">LA1 · Toca para seleccionar</p>
                                  </div>
                                  <Check size={14}
                                    className="text-[#C89B3C] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </button>
                              )}

                              {riotState === 'not_found' && (
                                <div className="px-4 py-3.5 flex flex-col gap-1">
                                  <div className="flex items-center gap-2.5">
                                    <X size={14} className="text-red-400 flex-shrink-0" />
                                    <span className="text-sm text-[#6B7280] font-inter">Cuenta no encontrada en LA1.</span>
                                  </div>
                                  <p className="text-[11px] text-[#374151] font-inter pl-[22px]">
                                    Si tienes un tag personalizado escríbelo así: <span className="text-[#6B7280]">Nombre#TAG</span>
                                  </p>
                                </div>
                              )}

                              {riotState === 'error' && (
                                <div className="px-4 py-3.5 flex items-center gap-2.5">
                                  <AlertCircle size={14} className="text-yellow-400 flex-shrink-0" />
                                  <span className="text-sm text-[#6B7280] font-inter">Error al consultar Riot API. Intenta de nuevo.</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-[11px] text-[#374151] font-inter">
                  Si tu tag no es <span className="text-[#6B7280]">#LAN</span>, escríbelo completo: <span className="text-[#6B7280]">Nombre#TAG</span>
                </p>
              </div>

              {/* Info note */}
              <div className="bg-[#C89B3C]/10 border border-[#C89B3C]/20 rounded-lg px-4 py-3">
                <p className="text-[#C89B3C] text-xs font-inter leading-relaxed">
                  Vincular tu cuenta es obligatorio para crear y aceptar retos. No guardamos contraseñas.
                </p>
              </div>

              {/* Submit */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={!isFormReady || isSubmitting}
                className="w-full mt-1"
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Configurando...' : 'Entrar al juego'}
              </Button>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    usernameState === 'available' ? 'bg-green-400' : 'bg-[#374151]'
                  }`} />
                  <span className="text-[11px] font-inter text-[#6B7280]">Usuario</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    selectedRiot ? 'bg-green-400' : 'bg-[#374151]'
                  }`} />
                  <span className="text-[11px] font-inter text-[#6B7280]">Cuenta LoL</span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
