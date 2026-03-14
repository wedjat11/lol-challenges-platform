'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useTemplates,
  useSearchUsers,
  useCreateChallenge,
  useBalance,
  useUser,
  type ChallengeTemplate,
  type ChallengeUser,
  type ParamSchema,
} from '@/hooks/useApiChallenges';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

// ─── Duration helpers ─────────────────────────────────────────────────────────

const ALLOWED_DURATION_DAYS = [7, 14, 21, 28] as const;
type AllowedDurationDays = (typeof ALLOWED_DURATION_DAYS)[number];

const GAMES_PARAM_VALIDATORS = new Set([
  'immortal',
  'deathless_streak',
  'escapist',
  'multikill_master',
  'first_blood_king',
  'visionary',
  'winning_streak',
]);

function getMinimumDays(
  validatorKey: string,
  params: Record<string, unknown>,
): 7 | 14 {
  if (GAMES_PARAM_VALIDATORS.has(validatorKey)) {
    const g = params.games;
    const count = typeof g === 'number' && g > 0 ? g : 1;
    return count >= 6 ? 14 : 7;
  }
  return 7;
}

function getAvailableDurations(
  validatorKey: string,
  params: Record<string, unknown>,
): AllowedDurationDays[] {
  const min = getMinimumDays(validatorKey, params);
  return ALLOWED_DURATION_DAYS.filter((d) => d >= min);
}

const DURATION_LABELS: Record<number, string> = {
  7: '7 días (1 semana)',
  14: '14 días (2 semanas)',
  21: '21 días (3 semanas)',
  28: '28 días (1 mes)',
};

// ─── Other helpers ────────────────────────────────────────────────────────────

function safeJsonParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const PARAM_LABELS: Record<string, string> = {
  // Legacy
  games: 'Número de partidas',
  champion: 'Nombre del campeón',
  assists: 'Número de asistencias',
  kills: 'Número de kills',
  // New validators
  max_deaths: 'Máximo de muertes por partida',
  max_avg_deaths: 'Promedio máximo de muertes',
  multikill_type: 'Tipo de multikill',
  damage: 'Daño requerido',
  kda: 'KDA mínimo requerido',
  cs_per_min: 'CS por minuto',
  gold: 'Oro a acumular',
  towers: 'Torretas a destruir / asistir',
  monsters: 'Monstruos épicos a cazar',
  camps: 'Campamentos enemigos a robar',
  percentage: 'Kill Participation (%)',
  vision_score: 'Vision Score mínimo',
};

const MULTIKILL_LABELS: Record<string, string> = {
  double: 'Double Kill',
  triple: 'Triple Kill',
  quadra: 'Cuádruple Kill',
  penta: 'Penta Kill',
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Rival', 'Reto', 'Confirmar'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done
                  ? 'bg-[#c89b3c] text-[#0a0e1a]'
                  : active
                    ? 'bg-[#c89b3c] text-[#0a0e1a] shadow-[0_0_15px_rgba(200,155,60,0.4)]'
                    : 'bg-white/10 text-[#a0aec0]'
              }`}
            >
              {done ? '✓' : step}
            </div>
            <span
              className={`text-xs hidden sm:block ${active ? 'text-white font-medium' : 'text-[#a0aec0]'}`}
            >
              {label}
            </span>
            {step < steps.length && (
              <div
                className={`h-0.5 w-6 sm:w-10 transition-colors ${done ? 'bg-[#c89b3c]' : 'bg-white/10'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Dynamic param form ───────────────────────────────────────────────────────

function ParamForm({
  schema,
  values,
  onChange,
}: {
  schema: ParamSchema;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(([key, prop]) => {
        const label = PARAM_LABELS[key] ?? key;
        const current = values[key];

        // String with enum → select dropdown
        if (prop.type === 'string' && prop.enum) {
          return (
            <div key={key}>
              <label className="label">{label}</label>
              <select
                className="input-base"
                value={typeof current === 'string' ? current : ''}
                onChange={(e) => onChange(key, e.target.value)}
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                {prop.enum.map((opt) => (
                  <option key={opt} value={opt}>
                    {MULTIKILL_LABELS[opt] ?? opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // Plain string → text input
        if (prop.type === 'string') {
          return (
            <Input
              key={key}
              label={label}
              placeholder={label}
              value={typeof current === 'string' ? current : ''}
              onChange={(e) => onChange(key, e.target.value)}
            />
          );
        }

        // Number → number input
        return (
          <div key={key}>
            <label className="label">
              {label}
              {prop.minimum !== undefined && prop.maximum !== undefined && (
                <span className="text-[#a0aec0] ml-2 font-normal text-xs">
                  ({prop.minimum} – {prop.maximum})
                </span>
              )}
            </label>
            <input
              type="number"
              className="input-base"
              value={typeof current === 'number' ? current : ''}
              min={prop.minimum}
              max={prop.maximum}
              step={prop.type === 'number' ? 0.1 : 1}
              onChange={(e) => onChange(key, Number(e.target.value))}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Select rival ────────────────────────────────────────────────────

function Step1({
  selectedUser,
  onSelect,
}: {
  selectedUser: ChallengeUser | null;
  onSelect: (user: ChallengeUser) => void;
}) {
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: results, isLoading } = useSearchUsers(debounced);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(input.trim()), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">
          ¿A quién desafías?
        </h2>
        <p className="text-[#a0aec0] text-sm">
          Escribe 3 letras del nombre LoL o el Riot ID completo (NOMBRE#TAG)
        </p>
      </div>

      <Input
        label="Buscar jugador"
        placeholder="ej: metroid, Faker#KR1..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        icon={<span>🔍</span>}
      />

      {/* Selected user preview */}
      {selectedUser && (
        <div className="glass rounded-xl p-4 border border-[#c89b3c]/40">
          <p className="text-xs text-[#c89b3c] mb-2 font-medium uppercase tracking-wider">
            Rival seleccionado
          </p>
          <UserRow user={selectedUser} />
        </div>
      )}

      {/* Search results */}
      {debounced.length >= 3 && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="glass rounded-xl p-4 animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="glass rounded-xl overflow-hidden border border-white/10">
              {results.map((u) => (
                <button
                  key={u.id}
                  className="w-full px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-b-0"
                  onClick={() => onSelect(u)}
                >
                  <UserRow user={u} />
                </button>
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-[#a0aec0] text-sm">
                No se encontró &ldquo;{debounced}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function summonerIconUrl(profileIconId: number | null | undefined): string | null {
  if (!profileIconId && profileIconId !== 0) return null;
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${profileIconId}.jpg`;
}

function UserRow({ user }: { user: ChallengeUser }) {
  const iconUrl = summonerIconUrl(user.riotAccount?.profileIconId);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-9 h-9 shrink-0">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt="Icono invocador"
            className="w-9 h-9 rounded-full object-cover border border-[#c89b3c]/30"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
            }}
          />
        ) : null}
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c89b3c]/40 to-[#0bc4e3]/40 flex items-center justify-center text-sm font-bold text-white"
          style={{ display: iconUrl ? 'none' : 'flex' }}
        >
          {user.username[0]?.toUpperCase() ?? '?'}
        </div>
        {user.riotAccount?.summonerLevel && (
          <div className="absolute -bottom-1 -right-1 bg-[#080B11] border border-white/10 rounded-sm px-0.5 leading-none">
            <span className="text-[9px] text-[#C89B3C] font-syne font-bold">
              {user.riotAccount.summonerLevel}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {user.riotAccount ? (
          <p className="text-white text-sm font-medium truncate">
            {user.riotAccount.gameName}
            <span className="text-[#6B7280]">#{user.riotAccount.tagLine}</span>
          </p>
        ) : (
          <p className="text-white text-sm font-medium">{user.username}</p>
        )}
        <p className="text-[#6B7280] text-xs truncate">{user.username}</p>
      </div>

      {user.hasRiotAccount && (
        <span className="text-green-400 text-xs shrink-0">✓</span>
      )}
    </div>
  );
}

// ─── Step 2 — Configure ───────────────────────────────────────────────────────

function Step2({
  targetUser,
  selectedTemplateId,
  localParams,
  durationDays,
  onSelectTemplate,
  onParamChange,
  onDurationChange,
}: {
  targetUser: ChallengeUser | null;
  selectedTemplateId: string;
  localParams: Record<string, unknown>;
  durationDays: number;
  onSelectTemplate: (t: ChallengeTemplate) => void;
  onParamChange: (key: string, value: unknown) => void;
  onDurationChange: (days: number) => void;
}) {
  const { data: templates, isLoading } = useTemplates();
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const availableDurations = selectedTemplate
    ? getAvailableDurations(selectedTemplate.validatorKey, localParams)
    : ALLOWED_DURATION_DAYS;

  const minimumDays = selectedTemplate
    ? getMinimumDays(selectedTemplate.validatorKey, localParams)
    : 7;

  // Auto-adjust selected duration if it's below the new minimum
  useEffect(() => {
    if (durationDays < minimumDays) {
      onDurationChange(minimumDays);
    }
  }, [minimumDays, durationDays, onDurationChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">
          Configura el reto
          {targetUser && (
            <span className="text-[#c89b3c]"> para {targetUser.username}</span>
          )}
        </h2>
        <p className="text-[#a0aec0] text-sm">
          Elige el tipo de desafío y sus parámetros
        </p>
      </div>

      {/* Template grid */}
      <div>
        <p className="label mb-3">Tipo de reto</p>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(templates ?? []).map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTemplate(t)}
                className={`text-left glass rounded-xl p-4 transition-all hover:bg-white/10 ${
                  selectedTemplateId === t.id
                    ? 'border-[#c89b3c] bg-[#c89b3c]/10 shadow-[0_0_15px_rgba(200,155,60,0.2)]'
                    : 'border-white/10'
                }`}
              >
                <p className="text-white font-semibold text-sm">{t.name}</p>
                <p className="text-[#a0aec0] text-xs mt-1 line-clamp-2">
                  {t.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Params form */}
      {selectedTemplate && (
        <div className="glass rounded-xl p-4 border border-white/10">
          <p className="label mb-4">Parámetros</p>
          <ParamForm
            schema={selectedTemplate.paramSchema}
            values={localParams}
            onChange={onParamChange}
          />
        </div>
      )}

      {/* Duration dropdown — REQUIRED, replaces old optional expiry */}
      <div className="glass rounded-xl p-4 border border-white/10 space-y-3">
        <div>
          <p className="text-white text-sm font-medium">Tiempo límite</p>
          <p className="text-[#a0aec0] text-xs mt-0.5">
            El plazo empieza a contar desde que el destinatario{' '}
            <span className="text-[#c89b3c] font-medium">acepte el reto</span>,
            no desde que lo crees.
          </p>
        </div>

        {/* Minimum notice */}
        {selectedTemplate && (
          <div className="flex items-start gap-2 rounded-lg bg-[#c89b3c]/8 border border-[#c89b3c]/20 px-3 py-2">
            <span className="text-[#c89b3c] text-sm mt-px">⏱</span>
            <p className="text-[#c89b3c] text-xs">
              Este reto requiere mínimo{' '}
              <strong>{minimumDays} días</strong>
              {minimumDays === 14
                ? ' porque necesita 6 o más partidas.'
                : ' (1 semana natural).'}
            </p>
          </div>
        )}

        <div>
          <label className="label mb-2">Selecciona el plazo</label>
          <select
            className="input-base"
            value={durationDays}
            onChange={(e) => onDurationChange(Number(e.target.value))}
          >
            {availableDurations.map((d) => (
              <option key={d} value={d}>
                {DURATION_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reward preview */}
      {selectedTemplate && (
        <div className="glass rounded-xl p-4 border border-[#c89b3c]/30 bg-[#c89b3c]/5">
          <p className="text-[#c89b3c] text-sm font-medium">
            💡 Fórmula de recompensa
          </p>
          <p className="text-white font-mono text-sm mt-1">
            {selectedTemplate.rewardFormula}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 3 — Confirm ─────────────────────────────────────────────────────────

function Step3({
  targetUser,
  template,
  params,
  durationDays,
  balance,
  isLoading,
  onSubmit,
}: {
  targetUser: ChallengeUser | null;
  template: ChallengeTemplate | null;
  params: Record<string, unknown>;
  durationDays: number;
  balance: number;
  isLoading: boolean;
  onSubmit: () => void;
}) {
  if (!targetUser || !template) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Confirma el reto</h2>
        <p className="text-[#a0aec0] text-sm">
          Revisa los detalles antes de enviar
        </p>
      </div>

      {/* VS banner */}
      <div className="glass rounded-xl overflow-hidden border border-white/10">
        <div className="bg-gradient-to-r from-[#c89b3c]/10 to-[#0bc4e3]/10 px-5 py-4 border-b border-white/10">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#c89b3c]/20 flex items-center justify-center text-base font-bold text-[#c89b3c] mb-1">
                Tú
              </div>
              <p className="text-white text-xs font-medium">Retador</p>
            </div>
            <span className="text-[#a0aec0] font-bold text-xl">VS</span>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#0bc4e3]/20 flex items-center justify-center text-base font-bold text-[#0bc4e3] mb-1">
                {targetUser.username[0]?.toUpperCase() ?? '?'}
              </div>
              <p className="text-white text-xs font-medium">
                {targetUser.username}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          <SummaryRow label="Tipo de reto" value={template.name} />
          {Object.entries(params).map(([key, val]) => (
            <SummaryRow
              key={key}
              label={PARAM_LABELS[key] ?? key}
              value={
                key === 'multikill_type' && typeof val === 'string'
                  ? (MULTIKILL_LABELS[val] ?? val)
                  : String(val)
              }
            />
          ))}
          <SummaryRow
            label="Plazo límite"
            value={DURATION_LABELS[durationDays] ?? `${durationDays} días`}
          />
        </div>
      </div>

      {/* Timing notice */}
      <div className="glass rounded-xl p-4 border border-[#3b82f6]/30 bg-[#3b82f6]/5">
        <div className="flex items-start gap-3">
          <span className="text-[#3b82f6] text-lg">📅</span>
          <div>
            <p className="text-white text-sm font-medium">
              El plazo empieza cuando acepten
            </p>
            <p className="text-[#a0aec0] text-xs mt-1">
              Los {durationDays} días contarán desde el momento exacto en que{' '}
              <strong className="text-white">{targetUser.username}</strong>{' '}
              acepte el reto. Solo se contarán partidas jugadas{' '}
              <span className="text-[#3b82f6]">después de la aceptación</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Cost warning */}
      <div
        className={`glass rounded-xl p-4 border ${
          balance >= 1
            ? 'border-[#c89b3c]/30 bg-[#c89b3c]/5'
            : 'border-red-500/30 bg-red-500/5'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{balance >= 1 ? '🪙' : '⚠️'}</span>
          <div>
            <p className="text-white text-sm font-medium">
              {balance >= 1
                ? 'Se descontará 1 moneda al enviar el reto'
                : 'Balance insuficiente para crear el reto'}
            </p>
            <p className="text-[#a0aec0] text-xs">
              Balance actual:{' '}
              <strong className="text-[#c89b3c]">{balance} monedas</strong>
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onSubmit}
        isLoading={isLoading}
        disabled={balance < 1 || isLoading}
      >
        ⚡ Enviar reto
      </Button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#a0aec0] text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right font-medium">{value}</span>
    </div>
  );
}

// ─── Wizard core (needs Suspense for useSearchParams) ─────────────────────────

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { data: balanceData } = useBalance();
  const createChallenge = useCreateChallenge();

  // URL-driven state
  const step = Math.max(1, Math.min(3, Number(searchParams.get('step') ?? '1')));
  const targetId = searchParams.get('targetId') ?? '';
  const templateId = searchParams.get('templateId') ?? '';

  // Local form state (step 2 form values, not persisted in URL per keystroke)
  const [localTemplateId, setLocalTemplateId] = useState(templateId);
  const [localParams, setLocalParams] = useState<Record<string, unknown>>(
    () => safeJsonParse(searchParams.get('params') ?? '{}'),
  );
  const [durationDays, setDurationDays] = useState<number>(
    Number(searchParams.get('durationDays') ?? '7'),
  );

  // Keep local template id in sync when URL changes (e.g. browser back)
  useEffect(() => {
    setLocalTemplateId(templateId);
    setLocalParams({});
  }, [templateId]);

  // Fetch target user when we have a targetId
  const { data: targetUser } = useUser(targetId);

  // Fetch templates to get the selected one for step 3
  const { data: templates } = useTemplates();
  const selectedTemplate =
    templates?.find((t) => t.id === localTemplateId) ?? null;

  const balance = balanceData?.balance ?? 0;

  // ── Navigation ──

  const buildBaseParams = () => {
    const sp = new URLSearchParams();
    if (targetId) sp.set('targetId', targetId);
    return sp;
  };

  const handleSelectUser = (user: ChallengeUser) => {
    const sp = new URLSearchParams();
    sp.set('step', '2');
    sp.set('targetId', user.id);
    router.push(`/app/challenges/new?${sp.toString()}`);
  };

  const handleSelectTemplate = (t: ChallengeTemplate) => {
    setLocalTemplateId(t.id);
    setLocalParams({});
    setDurationDays(7); // will auto-adjust via useEffect in Step2
    const sp = buildBaseParams();
    sp.set('step', '2');
    sp.set('templateId', t.id);
    router.replace(`/app/challenges/new?${sp.toString()}`);
  };

  const handleParamChange = (key: string, value: unknown) => {
    setLocalParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleBack = () => router.back();

  const handleToStep3 = () => {
    if (!localTemplateId) {
      showToast('Selecciona un tipo de reto', 'info');
      return;
    }
    if (Object.keys(localParams).length === 0) {
      showToast('Completa los parámetros del reto', 'info');
      return;
    }
    if (!durationDays) {
      showToast('Selecciona el tiempo límite', 'info');
      return;
    }
    const sp = new URLSearchParams();
    sp.set('step', '3');
    sp.set('targetId', targetId);
    sp.set('templateId', localTemplateId);
    sp.set('params', JSON.stringify(localParams));
    sp.set('durationDays', String(durationDays));
    router.push(`/app/challenges/new?${sp.toString()}`);
  };

  const handleSubmit = () => {
    if (!targetId || !selectedTemplate) return;

    createChallenge.mutate(
      {
        targetId,
        templateId: localTemplateId,
        params: localParams,
        durationDays,
      },
      {
        onSuccess: (challenge) => {
          showToast('¡Reto enviado con éxito!', 'success');
          router.push(`/app/challenges/${challenge.id}`);
        },
        onError: (err: unknown) => {
          const apiErr = err as {
            response?: { data?: { code?: string; message?: string | string[] } };
          };
          const raw = apiErr.response?.data;
          let msg: string;
          if (raw?.code === 'INSUFFICIENT_FUNDS') {
            msg = 'Balance insuficiente';
          } else if (raw?.code === 'DURATION_TOO_SHORT') {
            msg = typeof raw?.message === 'string'
              ? raw.message
              : 'El tiempo límite seleccionado es menor al mínimo requerido';
          } else if (Array.isArray(raw?.message)) {
            msg = raw.message.join(', ');
          } else {
            msg = raw?.message ?? 'Error al crear el reto';
          }
          showToast(msg, 'error');
        },
      },
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={
            step > 1
              ? handleBack
              : () => router.push('/app/challenges')
          }
          className="text-[#a0aec0] hover:text-white transition-colors text-xl"
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-white">Crear nuevo reto</h1>
      </div>

      <StepIndicator current={step} />

      {/* Step content */}
      <div className="glass-card">
        {step === 1 && (
          <Step1
            selectedUser={targetUser ?? null}
            onSelect={handleSelectUser}
          />
        )}
        {step === 2 && (
          <Step2
            targetUser={targetUser ?? null}
            selectedTemplateId={localTemplateId}
            localParams={localParams}
            durationDays={durationDays}
            onSelectTemplate={handleSelectTemplate}
            onParamChange={handleParamChange}
            onDurationChange={setDurationDays}
          />
        )}
        {step === 3 && (
          <Step3
            targetUser={targetUser ?? null}
            template={selectedTemplate}
            params={localParams}
            durationDays={durationDays}
            balance={balance}
            isLoading={createChallenge.isPending}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="ghost"
          size="md"
          onClick={step > 1 ? handleBack : () => router.push('/app/challenges')}
        >
          {step > 1 ? '← Anterior' : '← Cancelar'}
        </Button>

        {step === 1 && (
          <Button
            variant="primary"
            size="md"
            disabled={!targetUser}
            onClick={() => {
              if (targetUser) {
                const sp = new URLSearchParams();
                sp.set('step', '2');
                sp.set('targetId', targetId);
                router.push(`/app/challenges/new?${sp.toString()}`);
              }
            }}
          >
            Siguiente →
          </Button>
        )}

        {step === 2 && (
          <Button variant="primary" size="md" onClick={handleToStep3}>
            Siguiente →
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Page (wraps WizardContent in Suspense for useSearchParams) ───────────────

export default function NewChallengePage() {
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <WizardContent />
    </Suspense>
  );
}

function WizardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="h-8 bg-white/5 rounded w-1/2 animate-pulse" />
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-8 h-8 bg-white/5 rounded-full animate-pulse" />
        ))}
      </div>
      <SkeletonCard />
    </div>
  );
}
