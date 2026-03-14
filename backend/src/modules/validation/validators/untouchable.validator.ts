import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * INTOCABLE — Logra X asesinatos en UNA partida terminando con 0 muertes.
 * Condición: kills >= X AND deaths == 0 (en una sola partida)
 */
@Injectable()
export class UntouchableValidator implements IValidator {
  readonly validatorKey = 'untouchable';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredKills = (params.kills as number) ?? 10;

    let bestKills = 0;
    let qualifiedCount = 0;

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p && p.deaths === 0) {
        if (p.kills > bestKills) bestKills = p.kills;
        if (p.kills >= requiredKills) qualifiedCount++;
      }
    }

    const passed = qualifiedCount >= 1;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: ${requiredKills}+ kills con 0 muertes en una partida`
        : `Progreso: mejor racha sin morir fue ${bestKills} kills (requerido: ${requiredKills})`,
      snapshot: { bestKillsWithZeroDeaths: bestKills, requiredKills },
    };
  }
}
