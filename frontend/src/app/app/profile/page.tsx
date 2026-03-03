"use client";

import { useState } from "react";
import {
  useMe,
  useLinkRiotAccount,
  useUpdateRiotAccount,
  useTransactionsInfinite,
  useChallenges,
  type Transaction,
} from "@/hooks/useApiChallenges";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  Swords,
  Trophy,
  RotateCcw,
  Gift,
  Plus,
  Minus,
  Coins,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  TrendingUp,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TX_META: Record<string, { Icon: React.ElementType; label: string }> = {
  CHALLENGE_CREATED:   { Icon: Swords,    label: "Reto creado" },
  CHALLENGE_COMPLETED: { Icon: Trophy,    label: "Reto completado" },
  CHALLENGE_CANCELLED: { Icon: RotateCcw, label: "Reto cancelado" },
  SIGNUP_BONUS:        { Icon: Gift,      label: "Bono de bienvenida" },
  ADMIN_GRANT:         { Icon: Plus,      label: "Crédito admin" },
  ADMIN_DEDUCT:        { Icon: Minus,     label: "Débito admin" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "hace unos segundos";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins} minuto${mins > 1 ? "s" : ""}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? "es" : ""}`;
}

function getInitials(name: string): string {
  return name
    .split(/[\s_-]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  username,
  size = "md",
}: {
  username: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = { sm: "w-10 h-10 text-sm", md: "w-14 h-14 text-lg", lg: "w-20 h-20 text-2xl" };
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-white/[0.06] border border-[#C89B3C]/30 flex items-center justify-center font-syne font-black text-[#C89B3C] shrink-0`}
    >
      {getInitials(username)}
    </div>
  );
}

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
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7280] font-inter">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
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

// ─── TransactionRow ──────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.amount > 0;
  const { Icon: TxIcon, label } = TX_META[tx.type] ?? { Icon: Coins, label: tx.type };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
        <TxIcon size={13} strokeWidth={1.5} className="text-[#6B7280]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F0F2F5] text-sm font-inter truncate">{label}</p>
        <p className="text-[#6B7280] text-xs font-inter">{formatRelative(tx.createdAt)}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <Coins
            size={11}
            strokeWidth={1.5}
            className={isCredit ? "text-green-400/70" : "text-red-400/70"}
          />
          <p
            className={`font-bold text-sm font-syne tabular-nums ${
              isCredit ? "text-green-400" : "text-red-400"
            }`}
          >
            {isCredit ? "+" : ""}{tx.amount}
          </p>
        </div>
        <p className="text-[#6B7280] text-xs font-inter tabular-nums">{tx.balanceAfter} total</p>
      </div>
    </div>
  );
}

// ─── RiotAccountForm ─────────────────────────────────────────────────────────

function RiotAccountForm({
  initialGameName,
  initialTagLine,
  isNewAccount,
  onClose,
}: {
  initialGameName: string;
  initialTagLine: string;
  isNewAccount: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const linkRiot = useLinkRiotAccount();
  const updateRiot = useUpdateRiotAccount();
  const mutation = isNewAccount ? linkRiot : updateRiot;
  const [gameName, setGameName] = useState(initialGameName);
  const [tagLine, setTagLine] = useState(initialTagLine);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || !tagLine.trim()) {
      showToast("Completa todos los campos", "error");
      return;
    }
    mutation.mutate(
      { gameName: gameName.trim(), tagLine: tagLine.trim() },
      {
        onSuccess: () => {
          showToast(
            isNewAccount ? "Cuenta Riot vinculada" : "Cuenta Riot actualizada",
            "success",
          );
          onClose();
        },
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: { message?: string } } };
          showToast(
            apiErr.response?.data?.message ??
              (isNewAccount ? "Error al vincular la cuenta" : "Error al actualizar la cuenta"),
            "error",
          );
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 pt-5 border-t border-white/[0.06] flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nombre de invocador"
          placeholder="ej: Faker"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
        />
        <Input
          label="Tagline"
          placeholder="ej: KR1"
          value={tagLine}
          onChange={(e) => setTagLine(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// ─── ProfileSkeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-5 w-24 bg-white/[0.04] rounded mb-6" />
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-white/[0.06]" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-36 bg-white/[0.06] rounded" />
          <div className="h-4 w-24 bg-white/[0.04] rounded" />
          <div className="h-3 w-20 bg-white/[0.03] rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl h-24" />
        ))}
      </div>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl h-64" />
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl h-28" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: me, isLoading } = useMe();
  const [showRiotForm, setShowRiotForm] = useState(false);

  const { data: completedChallenges } = useChallenges({ role: "target", status: "COMPLETED" });
  const { data: allReceivedChallenges } = useChallenges({ role: "target" });

  const { data: txData, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTransactionsInfinite();

  if (isLoading || !me) return <ProfileSkeleton />;

  const allTx = txData?.pages.flatMap((p) => p.items ?? []) ?? [];

  const completedCount = completedChallenges?.items.length ?? 0;
  const receivedCount  = allReceivedChallenges?.items.length ?? 0;
  const successRate =
    receivedCount > 0 ? Math.round((completedCount / receivedCount) * 100) : 0;
  const coinsEarned = allTx
    .filter((t) => t.amount > 0 && t.type === "CHALLENGE_COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  const riotAccount = me.riotAccount;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-4">

      {/* ── Page header ── */}
      <div className="mb-4 pt-2">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280] font-inter mb-1.5">
          Perfil
        </p>
        <h1
          className="font-syne font-black text-[#F0F2F5] leading-none"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}
        >
          Tu cuenta
        </h1>
      </div>

      {/* ── Identity card ── */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar username={me.username} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="font-syne font-black text-[#F0F2F5] text-xl leading-tight truncate">
              {me.username}
            </h2>
            <p className="text-[#6B7280] text-sm font-inter mt-0.5">{me.email}</p>

            {riotAccount && (
              <div className="flex items-center gap-1.5 mt-2">
                {riotAccount.isVerified ? (
                  <CheckCircle2 size={11} strokeWidth={2} className="text-green-400/80 shrink-0" />
                ) : (
                  <AlertCircle size={11} strokeWidth={2} className="text-orange-400/80 shrink-0" />
                )}
                <span className="text-[#6B7280] text-xs font-mono">
                  {riotAccount.gameName}
                  <span className="text-[#6B7280]/40">#</span>
                  {riotAccount.tagLine}
                </span>
                {riotAccount.isVerified && (
                  <span className="text-green-400/70 text-[10px] font-inter">verificado</span>
                )}
              </div>
            )}

            <p className="text-[#6B7280]/60 text-xs font-inter mt-2">
              Miembro desde{" "}
              {new Date(me.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard Icon={Trophy}     label="Completados"   value={completedCount} />
        <StatCard Icon={TrendingUp} label="Tasa de éxito" value={`${successRate}%`} accent />
        <StatCard Icon={Coins}      label="Ganadas"       value={coinsEarned} />
      </div>

      {/* ── Balance + transaction history ── */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-5">

        {/* Balance */}
        <div className="flex items-start justify-between mb-5 pb-5 border-b border-white/[0.06]">
          <div>
            <p className="text-[11px] tracking-[0.12em] uppercase font-syne font-bold text-[#6B7280] mb-2">
              Balance
            </p>
            <div className="flex items-center gap-2">
              <Coins size={20} className="text-[#C89B3C]" strokeWidth={1.5} />
              <p className="text-3xl font-black font-syne tabular-nums text-[#C89B3C] leading-none">
                {me.balance}
              </p>
              <span className="text-[#6B7280] text-sm font-inter self-end mb-0.5">monedas</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#6B7280] text-xs font-inter">Ganadas en retos</p>
            <p className="text-[#F0F2F5] font-bold font-syne tabular-nums text-lg mt-0.5">
              +{coinsEarned}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <p className="text-[11px] tracking-[0.12em] uppercase font-syne font-bold text-[#6B7280] mb-3">
            Historial
          </p>

          {allTx.length === 0 ? (
            <div className="border border-dashed border-white/[0.08] rounded-xl p-6 text-center">
              <p className="text-[#6B7280] text-sm font-inter">Sin transacciones aún</p>
            </div>
          ) : (
            <div>
              {allTx.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                Cargar más
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Riot account ── */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.12em] uppercase font-syne font-bold text-[#6B7280] mb-1.5">
              League of Legends
            </p>
            {riotAccount ? (
              <p className="text-[#F0F2F5] text-sm font-inter">
                <span className="font-mono">{riotAccount.gameName}</span>
                <span className="text-[#6B7280]/40">#</span>
                <span className="font-mono text-[#6B7280]">{riotAccount.tagLine}</span>
              </p>
            ) : (
              <p className="text-orange-400/80 text-sm font-inter flex items-center gap-1.5">
                <AlertCircle size={13} strokeWidth={1.5} className="shrink-0" />
                Sin cuenta vinculada
              </p>
            )}
          </div>

          <button
            onClick={() => setShowRiotForm((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#F0F2F5] transition-colors duration-150 font-inter shrink-0 mt-0.5"
          >
            {showRiotForm ? (
              <><X size={13} strokeWidth={1.5} /> Cancelar</>
            ) : (
              <><Pencil size={13} strokeWidth={1.5} /> {riotAccount ? "Actualizar" : "Vincular"}</>
            )}
          </button>
        </div>

        {showRiotForm && (
          <RiotAccountForm
            initialGameName={riotAccount?.gameName ?? ""}
            initialTagLine={riotAccount?.tagLine ?? ""}
            isNewAccount={!riotAccount}
            onClose={() => setShowRiotForm(false)}
          />
        )}
      </div>

    </div>
  );
}
