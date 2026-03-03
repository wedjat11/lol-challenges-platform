"use client";

import Link from "next/link";
import { useState } from "react";
import { Swords, Target, CheckCircle2, TrendingUp, Plus, List, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useChallenges,
  useBalance,
  useAcceptChallenge,
  useRejectChallenge,
  type ChallengeStatus,
} from "@/hooks/useApiChallenges";
import { ChallengeCard } from "@/components/features/ChallengeCard";
import { SkeletonStats, SkeletonChallengeList } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  Icon,
  label,
  value,
  accent = false,
}: {
  Icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4
                 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7280] font-inter">{label}</p>
        <div
          className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06]
                     flex items-center justify-center flex-shrink-0"
        >
          <Icon
            size={13}
            strokeWidth={1.5}
            className={accent ? "text-[#C89B3C]" : "text-[#6B7280]"}
          />
        </div>
      </div>
      <p
        className={[
          "text-2xl font-black font-syne tabular-nums leading-none",
          accent ? "text-[#C89B3C]" : "text-[#F0F2F5]",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  href,
}: {
  title: string;
  count?: number;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
      <h2 className="text-xs tracking-[0.12em] uppercase font-syne font-bold text-[#6B7280] flex items-center gap-2">
        {title}
        {count !== undefined && count > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-[#C89B3C]/15 text-[#C89B3C] text-[10px] font-bold tabular-nums">
            {count}
          </span>
        )}
      </h2>
      <Link
        href={href}
        className="text-[11px] text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-150 font-inter"
      >
        Ver todos →
      </Link>
    </div>
  );
}

// ─── EmptySection ─────────────────────────────────────────────────────────────

function EmptySection({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-white/[0.08] rounded-xl p-8 text-center">
      <p className="text-[#6B7280] text-sm font-inter">{message}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: allData, isLoading: challengesLoading } = useChallenges();
  const { data: balanceData } = useBalance();
  const accept = useAcceptChallenge();
  const reject = useRejectChallenge();

  const [optimisticStatus, setOptimisticStatus] = useState<
    Record<string, ChallengeStatus>
  >({});

  const balance =
    balanceData?.balance ?? (user?.balance as number | undefined) ?? 0;
  const userId = user?.id as string | undefined;
  const username = (user?.username as string | undefined) ?? "—";

  const challenges = allData?.items ?? [];

  const sentCount = challenges.filter((c) => c.creatorId === userId).length;
  const receivedCount = challenges.filter((c) => c.targetId === userId).length;
  const completedCount = challenges.filter((c) => c.status === "COMPLETED").length;
  const failedCount = challenges.filter((c) => c.status === "FAILED").length;
  const successRate =
    completedCount + failedCount > 0
      ? Math.round((completedCount / (completedCount + failedCount)) * 100)
      : 0;

  const activeChallenges = challenges.filter((c) => {
    const effective = optimisticStatus[c.id] ?? c.status;
    return effective === "ACTIVE";
  });

  const pendingChallenges = challenges.filter((c) => {
    const effective = optimisticStatus[c.id] ?? c.status;
    return effective === "PENDING_ACCEPTANCE" && c.targetId === userId;
  });

  const handleAccept = (id: string) => {
    setOptimisticStatus((prev) => ({ ...prev, [id]: "ACTIVE" }));
    accept.mutate(id, {
      onError: () => {
        setOptimisticStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        showToast("Error al aceptar el reto", "error");
      },
      onSuccess: () => showToast("¡Reto aceptado! Comienza a jugar.", "success"),
    });
  };

  const handleReject = (id: string) => {
    setOptimisticStatus((prev) => ({ ...prev, [id]: "CANCELLED" }));
    reject.mutate(id, {
      onError: () => {
        setOptimisticStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        showToast("Error al rechazar el reto", "error");
      },
      onSuccess: () => showToast("Reto rechazado", "info"),
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8 pt-2">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] font-inter mb-1.5">
          Panel
        </p>
        <h1 className="font-syne font-black text-[#F0F2F5] leading-none" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
          Hola,{" "}
          <span className="text-[#C89B3C]">{username}</span>
        </h1>
      </div>

      {/* ── Stats — 2x2 mobile / 4 cols desktop ── */}
      {challengesLoading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard Icon={Swords} label="Enviados" value={sentCount} />
          <StatCard Icon={Target} label="Recibidos" value={receivedCount} />
          <StatCard Icon={CheckCircle2} label="Completados" value={completedCount} />
          <StatCard Icon={TrendingUp} label="Tasa de éxito" value={`${successRate}%`} accent />
        </div>
      )}

      {/* ── Active Challenges ── */}
      <section className="mb-8">
        <SectionHeader
          title="Retos activos"
          count={activeChallenges.length}
          href="/app/challenges"
        />
        {challengesLoading ? (
          <SkeletonChallengeList />
        ) : activeChallenges.length === 0 ? (
          <EmptySection message="No tienes retos activos en este momento." />
        ) : (
          <div className="space-y-2">
            {activeChallenges.slice(0, 3).map((c) => (
              <ChallengeCard key={c.id} challenge={c} userId={userId} compact />
            ))}
          </div>
        )}
      </section>

      {/* ── Pending Challenges ── */}
      <section className="mb-8">
        <SectionHeader
          title="Pendientes de aceptación"
          count={pendingChallenges.length}
          href="/app/challenges"
        />
        {challengesLoading ? (
          <SkeletonChallengeList />
        ) : pendingChallenges.length === 0 ? (
          <EmptySection message="No tienes retos esperando tu respuesta." />
        ) : (
          <div className="space-y-2">
            {pendingChallenges.slice(0, 3).map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                userId={userId}
                optimisticStatus={optimisticStatus[c.id]}
                onAccept={() => handleAccept(c.id)}
                onReject={() => handleReject(c.id)}
                isActioning={accept.isPending || reject.isPending}
                compact
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Quick actions — desktop ── */}
      <div className="hidden lg:flex items-center gap-3 pt-2 border-t border-white/[0.06]">
        <Link
          href="/app/challenges/new"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#C89B3C]
                     border border-[#C89B3C]/60 px-5 py-2.5 rounded-lg
                     hover:bg-[#C89B3C]/10 hover:border-[#C89B3C] transition-all duration-200"
        >
          <Zap size={14} strokeWidth={2} />
          Crear reto
        </Link>
        <Link
          href="/app/challenges"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7280]
                     border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 rounded-lg
                     hover:bg-white/[0.06] hover:text-[#F0F2F5] transition-all duration-200"
        >
          <List size={14} strokeWidth={1.5} />
          Ver todos mis retos
        </Link>
      </div>

      {/* ── FAB — mobile ── */}
      <Link
        href="/app/challenges/new"
        className="lg:hidden fixed bottom-20 right-4 z-40
                   w-12 h-12 rounded-full bg-[#C89B3C] text-[#080B11]
                   flex items-center justify-center
                   shadow-[0_0_24px_rgba(200,155,60,0.35)]
                   hover:scale-105 active:scale-95 transition-transform duration-150"
        aria-label="Crear reto"
      >
        <Plus size={20} strokeWidth={2.5} />
      </Link>

      {/* Balance shown only on mobile (sidebar shows it on desktop) */}
      <div className="lg:hidden mt-6 flex items-center gap-2 text-xs text-[#6B7280] font-inter">
        <span>Balance actual:</span>
        <span className="text-[#C89B3C] font-bold font-syne tabular-nums">{balance}</span>
        <span>monedas</span>
      </div>
    </div>
  );
}
