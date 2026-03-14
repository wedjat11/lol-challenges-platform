import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * KILL PARTICIPATION % — Logra una participación en asesinatos > X% en UNA partida.
 * Kill Participation = (kills + assists) / total kills del equipo
 * Usa challenges.killParticipation si disponible (valor 0-1).
 * Fallback: calcula desde el array de participantes con el mismo teamId.
 */
@Injectable()
export class KillParticipationValidator implements IValidator {
  readonly validatorKey = 'kill_participation';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredPct = (params.percentage as number) ?? 60;

    let bestParticipation = 0;
    let qualifiedCount = 0;

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (!p) continue;

      let participationPct: number;

      if (typeof p.challenges?.killParticipation === 'number') {
        // challenges.killParticipation is 0-1 float
        participationPct = p.challenges.killParticipation * 100;
      } else {
        // Fallback: sum team kills from participants array
        const teamKills = match.info.participants
          .filter((x) => x.teamId === p.teamId)
          .reduce((sum, x) => sum + x.kills, 0);

        participationPct = teamKills > 0
          ? ((p.kills + p.assists) / teamKills) * 100
          : 0;
      }

      if (participationPct > bestParticipation) bestParticipation = participationPct;
      if (participationPct > requiredPct) qualifiedCount++;
    }

    const passed = qualifiedCount >= 1;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: ${bestParticipation.toFixed(1)}% de participación en kills (requerido: >${requiredPct}%)`
        : `Progreso: mejor participación ${bestParticipation.toFixed(1)}% (requerido: >${requiredPct}%)`,
      snapshot: { bestParticipation, requiredPct },
    };
  }
}
