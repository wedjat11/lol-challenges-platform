'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useChallengesInfinite,
  useAcceptChallenge,
  useRejectChallenge,
  type Challenge,
  type ChallengeStatus,
} from '@/hooks/useApiChallenges';
// Challenge + ChallengeStatus kept for the optimistic state map
import { ChallengeCard } from '@/components/features/ChallengeCard';
import { SkeletonChallengeList } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'all' | 'sent' | 'received';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING_ACCEPTANCE', label: 'Pendiente' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'FAILED', label: 'Fallido' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];


// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabType }) {
  const messages: Record<TabType, { icon: string; text: string }> = {
    all: { icon: '⚔️', text: 'No tienes retos todavía.' },
    sent: { icon: '📤', text: 'No has enviado ningún reto.' },
    received: { icon: '📥', text: 'No has recibido ningún reto.' },
  };
  const { icon, text } = messages[tab];

  return (
    <div className="glass rounded-xl p-12 flex flex-col items-center text-center gap-4">
      <span className="text-6xl">{icon}</span>
      <p className="text-[#a0aec0] text-lg">{text}</p>
      <Link href="/app/challenges/new" className="btn btn-secondary btn-sm">
        Crear un reto
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id as string | undefined;

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, ChallengeStatus>
  >({});

  const accept = useAcceptChallenge();
  const reject = useRejectChallenge();

  // Read initial tab from URL on mount only
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const tab = sp.get('tab');
    const status = sp.get('status');
    if (tab === 'sent' || tab === 'received') setActiveTab(tab);
    if (status) setStatusFilter(status);
  }, []);

  const queryRole =
    activeTab === 'sent'
      ? ('creator' as const)
      : activeTab === 'received'
        ? ('target' as const)
        : undefined;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useChallengesInfinite({
    role: queryRole,
    status: statusFilter || undefined,
  });

  const allItems: Challenge[] = data?.pages.flatMap((p) => p.items) ?? [];

  // Reset optimistic when tab/status changes
  useEffect(() => {
    setOptimisticStatuses({});
  }, [activeTab, statusFilter]);

  const handleAccept = (id: string) => {
    setOptimisticStatuses((prev) => ({ ...prev, [id]: 'ACTIVE' }));
    accept.mutate(id, {
      onError: () => {
        setOptimisticStatuses((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        showToast('Error al aceptar el reto', 'error');
      },
      onSuccess: () => showToast('¡Reto aceptado!', 'success'),
    });
  };

  const handleReject = (id: string) => {
    setOptimisticStatuses((prev) => ({ ...prev, [id]: 'CANCELLED' }));
    reject.mutate(id, {
      onError: () => {
        setOptimisticStatuses((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        showToast('Error al rechazar el reto', 'error');
      },
      onSuccess: () => showToast('Reto rechazado', 'info'),
    });
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: '📋' },
    { id: 'sent', label: 'Enviados', icon: '⚔️' },
    { id: 'received', label: 'Recibidos', icon: '🎯' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Mis Retos
        </h1>
        <Link
          href="/app/challenges/new"
          className="btn btn-primary btn-sm hidden md:flex"
        >
          + Crear reto
        </Link>
      </div>

      {/* ── Tabs + Filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#c89b3c] text-[#0a0e1a]'
                  : 'text-[#a0aec0] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base sm:w-52 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <SkeletonChallengeList />
      ) : allItems.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {allItems.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              userId={userId}
              optimisticStatus={optimisticStatuses[challenge.id]}
              onAccept={() => handleAccept(challenge.id)}
              onReject={() => handleReject(challenge.id)}
              isActioning={accept.isPending || reject.isPending}
            />
          ))}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                size="md"
                onClick={() => void fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                Cargar más
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── FAB mobile ── */}
      <Link
        href="/app/challenges/new"
        className="fixed bottom-24 right-4 md:hidden w-14 h-14 rounded-full bg-[#c89b3c] text-[#0a0e1a] flex items-center justify-center text-2xl font-bold shadow-[0_0_20px_rgba(200,155,60,0.5)] hover:scale-110 transition-transform z-40"
        aria-label="Crear reto"
      >
        +
      </Link>
    </div>
  );
}
