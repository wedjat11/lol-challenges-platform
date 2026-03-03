"use client";

import { useRouter } from "next/navigation";
import { Clock, Coins } from "lucide-react";
import { type Challenge, type ChallengeStatus } from "@/hooks/useApiChallenges";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChallengeCardProps {
  challenge: Challenge;
  userId?: string;
  optimisticStatus?: ChallengeStatus;
  onAccept?: () => void;
  onReject?: () => void;
  isActioning?: boolean;
  /** compact=true → tighter layout for dashboard; false → full list card */
  compact?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ChallengeStatus, string> = {
  PENDING_ACCEPTANCE: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  ACTIVE:             "bg-blue-500/15 text-blue-300 border-blue-500/25",
  COMPLETED:          "bg-green-500/15 text-green-300 border-green-500/25",
  FAILED:             "bg-red-500/15 text-red-300 border-red-500/25",
  EXPIRED:            "bg-white/5 text-[#6B7280] border-white/10",
  CANCELLED:          "bg-white/5 text-[#6B7280] border-white/10",
};

const STATUS_LABELS: Record<ChallengeStatus, string> = {
  PENDING_ACCEPTANCE: "Pendiente",
  ACTIVE:             "Activo",
  COMPLETED:          "Completado",
  FAILED:             "Fallido",
  EXPIRED:            "Expirado",
  CANCELLED:          "Cancelado",
};

// Left border accent per status — Darkroom-style vertical indicator
const BORDER_ACCENT: Record<ChallengeStatus, string> = {
  PENDING_ACCEPTANCE: "border-l-yellow-500/40",
  ACTIVE:             "border-l-blue-500/40",
  COMPLETED:          "border-l-green-500/30",
  FAILED:             "border-l-red-500/30",
  EXPIRED:            "border-l-white/10",
  CANCELLED:          "border-l-white/10",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChallengeStatus }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border inline-flex items-center gap-1 ${STATUS_STYLES[status]}`}
    >
      {status === "ACTIVE" && (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
        </span>
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── ChallengeCard ────────────────────────────────────────────────────────────

export function ChallengeCard({
  challenge,
  userId,
  optimisticStatus,
  onAccept,
  onReject,
  isActioning = false,
  compact = false,
}: ChallengeCardProps) {
  const router = useRouter();

  const effectiveStatus: ChallengeStatus = optimisticStatus ?? challenge.status;
  const isTarget = challenge.targetId === userId;
  const isCreator = challenge.creatorId === userId;
  const rival = isTarget ? challenge.creator : challenge.target;

  const canAcceptReject = effectiveStatus === "PENDING_ACCEPTANCE" && isTarget;
  const showDetail =
    effectiveStatus === "ACTIVE" ||
    effectiveStatus === "COMPLETED" ||
    effectiveStatus === "FAILED";

  const directionLabel = isTarget
    ? `de ${rival.username}`
    : isCreator
      ? `para ${rival.username}`
      : rival.username;

  const handleCardClick = () => {
    router.push(`/app/challenges/${challenge.id}`);
  };

  // ── Compact card (dashboard) ─────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={[
          "relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4",
          "border-l-2", BORDER_ACCENT[effectiveStatus],
          "cursor-pointer hover:bg-white/[0.06] transition-colors duration-150",
        ].join(" ")}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusBadge status={effectiveStatus} />
              <span className="text-[#6B7280] text-[11px] font-inter">{directionLabel}</span>
            </div>
            <p className="text-[#F0F2F5] font-medium text-sm truncate font-inter">
              {challenge.template.name}
            </p>
            {challenge.expiresAt && effectiveStatus === "ACTIVE" && (
              <p className="text-orange-400/80 text-[11px] mt-1 flex items-center gap-1 font-inter">
                <Clock size={10} strokeWidth={1.5} />
                {getTimeRemaining(challenge.expiresAt)}
              </p>
            )}
          </div>
          <div className="text-right shrink-0 flex items-center gap-1">
            <Coins size={12} className="text-[#C89B3C]" strokeWidth={1.5} />
            <span className="text-[#C89B3C] font-bold text-sm font-syne tabular-nums">
              +{challenge.rewardAmount}
            </span>
          </div>
        </div>

        {canAcceptReject && (onAccept ?? onReject) && (
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            {onAccept && (
              <Button variant="secondary" size="sm" onClick={onAccept} disabled={isActioning}>
                ✓ Aceptar
              </Button>
            )}
            {onReject && (
              <Button variant="ghost" size="sm" onClick={onReject} disabled={isActioning}>
                ✕
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Full card (challenges list) ───────────────────────────────────────────────
  return (
    <div
      className={[
        "bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 md:p-5",
        "border-l-2", BORDER_ACCENT[effectiveStatus],
        "cursor-pointer hover:bg-white/[0.06] transition-colors duration-150",
      ].join(" ")}
      onClick={handleCardClick}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={effectiveStatus} />
            <span className="text-[#6B7280] text-xs font-inter">{directionLabel}</span>
          </div>
          <p className="text-[#F0F2F5] font-semibold truncate font-inter">
            {challenge.template.name}
          </p>
          <p className="text-[#6B7280] text-sm truncate mt-0.5 font-inter">
            {challenge.template.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#6B7280] font-inter">
            <span>
              {new Date(challenge.createdAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
            {challenge.expiresAt && effectiveStatus === "ACTIVE" && (
              <span className="text-orange-400/80 flex items-center gap-1">
                <Clock size={10} strokeWidth={1.5} />
                {getTimeRemaining(challenge.expiresAt)}
              </span>
            )}
          </div>
        </div>

        {/* Right: reward + actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
          <div className="text-right flex items-center gap-1.5">
            <Coins size={14} className="text-[#C89B3C]" strokeWidth={1.5} />
            <div>
              <p className="text-[#C89B3C] font-bold text-lg font-syne tabular-nums leading-none">
                +{challenge.rewardAmount}
              </p>
              <p className="text-[#6B7280] text-[10px] font-inter">monedas</p>
            </div>
          </div>

          {canAcceptReject && (onAccept ?? onReject) && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {onAccept && (
                <Button variant="secondary" size="sm" onClick={onAccept} disabled={isActioning}>
                  ✓ Aceptar
                </Button>
              )}
              {onReject && (
                <Button variant="ghost" size="sm" onClick={onReject} disabled={isActioning}>
                  ✕ Rechazar
                </Button>
              )}
            </div>
          )}

          {showDetail && (
            <button
              className="text-[#C89B3C] text-sm hover:text-[#d4a94a] transition-colors font-inter"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/app/challenges/${challenge.id}`);
              }}
            >
              Ver detalle →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
