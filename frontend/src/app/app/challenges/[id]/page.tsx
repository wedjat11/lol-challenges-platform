'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  useChallenge,
  useAcceptChallenge,
  useRejectChallenge,
  useTriggerValidation,
  type ChallengeStatus,
  type ValidationLog,
} from '@/hooks/useApiChallenges';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

const STATUS_STYLES: Record<ChallengeStatus, string> = {
  PENDING_ACCEPTANCE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  ACTIVE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  COMPLETED: 'bg-green-500/20 text-green-300 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-300 border-red-500/30',
  EXPIRED: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const STATUS_LABELS: Record<ChallengeStatus, string> = {
  PENDING_ACCEPTANCE: 'Pendiente de aceptación',
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

const PARAM_LABELS: Record<string, string> = {
  games: 'Partidas objetivo',
  champion: 'Campeón',
  assists: 'Asistencias objetivo',
  kills: 'Kills objetivo',
};

const VALIDATION_RESULT_STYLES = {
  PASS: 'text-green-400',
  FAIL: 'text-red-400',
  ERROR: 'text-orange-400',
  DEFERRED: 'text-[#a0aec0]',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expirado';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChallengeStatus }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium border inline-flex items-center gap-2 ${STATUS_STYLES[status]}`}
    >
      {status === 'ACTIVE' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

function ParticipantCard({
  label,
  username,
  riotName,
  color,
}: {
  label: string;
  username: string;
  riotName?: string;
  color: 'gold' | 'blue';
}) {
  const colorMap = {
    gold: 'from-[#c89b3c]/30 to-[#c89b3c]/10 border-[#c89b3c]/30',
    blue: 'from-[#0bc4e3]/30 to-[#0bc4e3]/10 border-[#0bc4e3]/30',
  };
  const textMap = {
    gold: 'text-[#c89b3c]',
    blue: 'text-[#0bc4e3]',
  };

  return (
    <div
      className={`flex-1 glass rounded-xl p-4 bg-gradient-to-br ${colorMap[color]} text-center`}
    >
      <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${textMap[color]}`}>
        {label}
      </p>
      <div
        className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl font-bold text-[#0a0e1a] mb-2 ${
          color === 'gold' ? 'bg-[#c89b3c]' : 'bg-[#0bc4e3]'
        }`}
      >
        {username[0]?.toUpperCase() ?? '?'}
      </div>
      <p className="text-white font-semibold">{username}</p>
      {riotName && (
        <p className="text-[#a0aec0] text-xs mt-1">{riotName}</p>
      )}
    </div>
  );
}

function ValidationLogCard({ log }: { log: ValidationLog }) {
  const resultStyle =
    VALIDATION_RESULT_STYLES[log.result] ?? 'text-[#a0aec0]';

  const resultLabels = {
    PASS: '✅ Aprobado',
    FAIL: '❌ No cumplido',
    ERROR: '⚠️ Error',
    DEFERRED: '⏳ Diferido',
  };

  return (
    <div className="glass rounded-xl p-4 border border-white/5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`font-semibold text-sm ${resultStyle}`}>
          {resultLabels[log.result] ?? log.result}
        </span>
        <span className="text-[#a0aec0] text-xs shrink-0">
          {formatDateShort(log.createdAt)}
        </span>
      </div>
      <div className="flex gap-6 text-sm text-[#a0aec0] mb-2">
        <span>Evaluadas: <strong className="text-white">{log.matchesEvaluated}</strong></span>
        <span>Califican: <strong className="text-white">{log.matchesQualified}</strong></span>
      </div>
      {log.reason && (
        <p className="text-[#a0aec0] text-xs border-t border-white/5 pt-2 mt-2">
          {log.reason}
        </p>
      )}
    </div>
  );
}

// ─── CSS Confetti (no external libraries) ─────────────────────────────────────

function Confetti() {
  const COLORS = [
    '#c89b3c',
    '#0bc4e3',
    '#ff6b6b',
    '#51cf66',
    '#339af0',
    '#f06595',
    '#ffd43b',
    '#ffffff',
  ];

  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: `${(Math.random() * 1.8).toFixed(2)}s`,
        duration: `${(2 + Math.random() * 2).toFixed(2)}s`,
        size: `${Math.round(5 + Math.random() * 8)}px`,
        isCircle: Math.random() > 0.5,
        rotate: Math.round(Math.random() * 360),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Keyframes injected via style tag — no CSS file needed */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-12px) rotate(0deg) scale(1); opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(600deg) scale(0.4); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-12px',
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function CelebrationBanner() {
  const [showConfetti, setShowConfetti] = useState(true);

  // Auto-hide confetti after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="glass rounded-xl p-6 border border-green-500/40 bg-green-500/10 text-center mb-6">
        <div className="text-5xl mb-3">🏆</div>
        <h3 className="text-2xl font-bold text-green-400 mb-1">
          ¡Reto completado!
        </h3>
        <p className="text-[#a0aec0] text-sm">
          Felicitaciones — la recompensa ha sido acreditada
        </p>
      </div>
    </>
  );
}

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/5 rounded w-1/2" />
      <div className="h-4 bg-white/5 rounded w-1/4" />
      <div className="flex gap-4">
        <div className="flex-1 h-36 bg-white/5 rounded-xl" />
        <div className="flex-1 h-36 bg-white/5 rounded-xl" />
      </div>
      <div className="h-32 bg-white/5 rounded-xl" />
      <div className="h-24 bg-white/5 rounded-xl" />
    </div>
  );
}

// ─── Cooldown countdown hook ──────────────────────────────────────────────────

function useCooldown() {
  const [lastTriggeredAt, setLastTriggeredAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (lastTriggeredAt === null) return;

    const tick = () => {
      const elapsed = Date.now() - lastTriggeredAt;
      const remaining = Math.max(0, COOLDOWN_MS - elapsed);
      setRemainingMs(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastTriggeredAt]);

  const trigger = () => {
    setLastTriggeredAt(Date.now());
    setRemainingMs(COOLDOWN_MS);
  };

  const inCooldown = remainingMs > 0;
  const displayStr = `${Math.floor(remainingMs / 60_000)}:${String(
    Math.floor((remainingMs % 60_000) / 1000),
  ).padStart(2, '0')}`;

  return { trigger, inCooldown, displayStr };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChallengeDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const queryClient = useQueryClient();
  const { data: challenge, isLoading, refetch } = useChallenge(id);
  const accept = useAcceptChallenge();
  const reject = useRejectChallenge();
  const validate = useTriggerValidation();
  const cooldown = useCooldown();

  const userId = user?.id as string | undefined;

  // ── Invalidate balance + profile when challenge completes ──
  useEffect(() => {
    if (challenge?.status === 'COMPLETED') {
      void queryClient.invalidateQueries({ queryKey: ['economy/balance'] });
      void queryClient.invalidateQueries({ queryKey: ['users/me'] });
      void queryClient.invalidateQueries({
        queryKey: ['economy/transactions-infinite'],
      });
    }
  }, [challenge?.status, queryClient]);

  // ── Optimistic local status ──
  const [optimisticStatus, setOptimisticStatus] = useState<
    ChallengeStatus | null
  >(null);

  const effectiveStatus: ChallengeStatus | undefined =
    optimisticStatus ?? challenge?.status;

  // ── Handlers ──
  const handleAccept = () => {
    setOptimisticStatus('ACTIVE');
    accept.mutate(id, {
      onError: () => {
        setOptimisticStatus(null);
        showToast('Error al aceptar el reto', 'error');
      },
      onSuccess: () => {
        showToast('¡Reto aceptado! Comienza a jugar.', 'success');
        void refetch();
      },
    });
  };

  const handleReject = () => {
    setOptimisticStatus('CANCELLED');
    reject.mutate(id, {
      onError: () => {
        setOptimisticStatus(null);
        showToast('Error al rechazar el reto', 'error');
      },
      onSuccess: () => showToast('Reto rechazado', 'info'),
    });
  };

  const handleValidate = () => {
    if (cooldown.inCooldown) return;
    validate.mutate(id, {
      onSuccess: () => {
        cooldown.trigger();
        showToast(
          'Verificación en proceso... Los resultados estarán listos en breve.',
          'info',
        );
      },
      onError: (err: unknown) => {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 429) {
          cooldown.trigger();
          showToast('Debes esperar antes de verificar de nuevo', 'error');
        } else {
          showToast('Error al iniciar la verificación', 'error');
        }
      },
    });
  };

  // ── Render loading ──
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <SkeletonDetail />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto text-center">
        <p className="text-[#a0aec0] text-lg">Reto no encontrado</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => router.push('/app/challenges')}
        >
          ← Volver
        </Button>
      </div>
    );
  }

  const isCreator = challenge.creatorId === userId;
  const isTarget = challenge.targetId === userId;
  const logs = challenge.validationLogs ?? [];
  const lastLog = logs[logs.length - 1] as ValidationLog | undefined;
  const creatorRiotName = challenge.creator.riotAccount
    ? `${challenge.creator.riotAccount.gameName}#${challenge.creator.riotAccount.tagLine}`
    : undefined;
  const targetRiotName = challenge.target.riotAccount
    ? `${challenge.target.riotAccount.gameName}#${challenge.target.riotAccount.tagLine}`
    : undefined;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* ── Back ── */}
      <button
        onClick={() => router.push('/app/challenges')}
        className="flex items-center gap-2 text-[#a0aec0] hover:text-white transition-colors mb-6 text-sm"
      >
        ← Mis retos
      </button>

      {/* ── Celebration banner ── */}
      {effectiveStatus === 'COMPLETED' && <CelebrationBanner />}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {challenge.template.name}
          </h1>
          <p className="text-[#a0aec0] text-sm">
            {challenge.template.description}
          </p>
        </div>
        {effectiveStatus && <StatusBadge status={effectiveStatus} />}
      </div>

      {/* ── Participants ── */}
      <div className="flex gap-3 mb-6">
        <ParticipantCard
          label="Retador"
          username={challenge.creator.username}
          riotName={creatorRiotName}
          color="gold"
        />
        <div className="flex items-center justify-center px-2">
          <span className="text-[#a0aec0] font-bold text-xl">VS</span>
        </div>
        <ParticipantCard
          label="Retado"
          username={challenge.target.username}
          riotName={targetRiotName}
          color="blue"
        />
      </div>

      {/* ── Challenge params ── */}
      <div className="glass rounded-xl p-5 mb-4 border border-white/10">
        <p className="text-[#a0aec0] text-xs font-medium uppercase tracking-wider mb-3">
          Parámetros del reto
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(challenge.params).map(([key, value]) => (
            <div key={key} className="bg-white/5 rounded-lg p-3">
              <p className="text-[#a0aec0] text-xs">
                {PARAM_LABELS[key] ?? key}
              </p>
              <p className="text-white font-bold text-lg">{String(value)}</p>
            </div>
          ))}
          <div className="bg-[#c89b3c]/10 rounded-lg p-3 border border-[#c89b3c]/20">
            <p className="text-[#a0aec0] text-xs">Recompensa</p>
            <p className="text-[#c89b3c] font-bold text-lg">
              +{challenge.rewardAmount} 🪙
            </p>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="glass rounded-xl p-5 mb-4 border border-white/10">
        <p className="text-[#a0aec0] text-xs font-medium uppercase tracking-wider mb-4">
          Timeline
        </p>
        <div className="space-y-3">
          <TimelineItem
            icon="⚔️"
            label="Reto creado"
            date={challenge.createdAt}
          />
          {challenge.acceptedAt && (
            <TimelineItem
              icon="✅"
              label="Reto aceptado — ventana de validación inicia"
              date={challenge.acceptedAt}
              highlight
            />
          )}
          {challenge.expiresAt && (
            <TimelineItem
              icon="⏱"
              label={`Expira — ${getTimeRemaining(challenge.expiresAt)}`}
              date={challenge.expiresAt}
            />
          )}
          {challenge.completedAt && (
            <TimelineItem
              icon="🏆"
              label="Reto completado"
              date={challenge.completedAt}
              highlight
            />
          )}
        </div>
      </div>

      {/* ── Latest validation result ── */}
      {lastLog && (
        <div className="glass rounded-xl p-5 mb-4 border border-white/10">
          <p className="text-[#a0aec0] text-xs font-medium uppercase tracking-wider mb-3">
            Último resultado de verificación
          </p>
          <ValidationLogCard log={lastLog} />

          {logs.length > 1 && (
            <details className="mt-3">
              <summary className="text-[#c89b3c] text-sm cursor-pointer hover:underline">
                Ver historial ({logs.length} verificaciones)
              </summary>
              <div className="mt-3 space-y-2">
                {[...logs]
                  .reverse()
                  .slice(1)
                  .map((log) => (
                    <ValidationLogCard key={log.id} log={log} />
                  ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      {effectiveStatus === 'PENDING_ACCEPTANCE' && isTarget && (
        <div className="glass rounded-xl p-5 border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-white font-semibold mb-1">
            {challenge.creator.username} te ha retado
          </p>
          <p className="text-[#a0aec0] text-sm mb-4">
            {challenge.template.description}
          </p>
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleAccept}
              isLoading={accept.isPending}
            >
              ✓ Aceptar reto
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={handleReject}
              isLoading={reject.isPending}
            >
              ✕ Rechazar
            </Button>
          </div>
        </div>
      )}

      {effectiveStatus === 'ACTIVE' && isTarget && (
        <div className="glass rounded-xl p-5 border border-blue-500/20 bg-blue-500/5">
          <p className="text-white font-semibold mb-1">
            ¡El reto está activo!
          </p>
          <p className="text-[#a0aec0] text-sm mb-4">
            Juega partidas y verifica tu progreso. Solo cuentan partidas desde
            que aceptaste el reto.
          </p>

          {validate.isPending ? (
            <div className="flex items-center gap-3 text-blue-300">
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Verificando progreso...</span>
            </div>
          ) : cooldown.inCooldown ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/5 rounded-lg p-3">
                <p className="text-[#a0aec0] text-xs mb-1">
                  Próxima verificación disponible en:
                </p>
                <p className="text-white font-mono text-xl font-bold">
                  {cooldown.displayStr}
                </p>
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleValidate}
              disabled={cooldown.inCooldown}
            >
              🔄 Verificar progreso
            </Button>
          )}
        </div>
      )}

      {effectiveStatus === 'ACTIVE' && isCreator && (
        <div className="glass rounded-xl p-5 border border-blue-500/20 bg-blue-500/5">
          <p className="text-white font-semibold mb-1">
            Reto en progreso
          </p>
          <p className="text-[#a0aec0] text-sm">
            {challenge.target.username} debe completar el reto. El progreso
            se actualiza cada 10 segundos.
          </p>
        </div>
      )}

      {(effectiveStatus === 'EXPIRED' || effectiveStatus === 'FAILED') && (
        <div className="glass rounded-xl p-5 border border-red-500/20 bg-red-500/5">
          <p className="text-red-400 font-semibold mb-1">
            {effectiveStatus === 'EXPIRED'
              ? '⏱ Reto expirado'
              : '❌ Reto fallido'}
          </p>
          <p className="text-[#a0aec0] text-sm">
            {effectiveStatus === 'EXPIRED'
              ? 'El tiempo para completar este reto ha terminado.'
              : 'El reto no fue completado exitosamente.'}
          </p>
        </div>
      )}

      {/* ── Challenge ID (for reference) ── */}
      <p className="text-white/20 text-xs mt-6 text-center font-mono">
        ID: {challenge.id}
      </p>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  highlight = false,
}: {
  icon: string;
  label: string;
  date: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${highlight ? 'text-white font-medium' : 'text-[#a0aec0]'}`}
        >
          {label}
        </p>
        <p className="text-[#a0aec0] text-xs">{formatDateShort(date)}</p>
      </div>
    </div>
  );
}
