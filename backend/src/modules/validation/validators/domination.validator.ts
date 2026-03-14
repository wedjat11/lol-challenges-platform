import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * DOMINACIÓN — Logra un KDA ratio superior a X en una partida ganada.
 * KDA = (kills + assists) / max(deaths, 1)
 */
@Injectable()
export class DominationValidator implements IValidator {
  readonly validatorKey = 'domination';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredKda = (params.kda as number) ?? 5.0;

    let bestKda = 0;
    let qualifiedCount = 0;

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p && p.win) {
        const kda = (p.kills + p.assists) / Math.max(p.deaths, 1);
        if (kda > bestKda) bestKda = kda;
        if (kda > requiredKda) qualifiedCount++;
      }
    }

    const passed = qualifiedCount >= 1;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: KDA ${bestKda.toFixed(2)} en una victoria (requerido: >${requiredKda})`
        : `Progreso: mejor KDA en victoria ${bestKda.toFixed(2)} (requerido: >${requiredKda})`,
      snapshot: { bestKda, requiredKda },
    };
  }
}
