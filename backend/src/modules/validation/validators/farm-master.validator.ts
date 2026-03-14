import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * AMO DEL FARM — Logra un promedio de X súbditos por minuto en UNA partida.
 * CS/min = (totalMinionsKilled + neutralMinionsKilled) / (gameDuration / 60)
 */
@Injectable()
export class FarmMasterValidator implements IValidator {
  readonly validatorKey = 'farm_master';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredCsPerMin = (params.cs_per_min as number) ?? 7.0;

    let bestCsPerMin = 0;
    let qualifiedCount = 0;

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p && match.info.gameDuration > 0) {
        const totalCs = p.totalMinionsKilled + p.neutralMinionsKilled;
        const durationMinutes = match.info.gameDuration / 60;
        const csPerMin = totalCs / durationMinutes;

        if (csPerMin > bestCsPerMin) bestCsPerMin = csPerMin;
        if (csPerMin >= requiredCsPerMin) qualifiedCount++;
      }
    }

    const passed = qualifiedCount >= 1;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: ${bestCsPerMin.toFixed(1)} CS/min en una partida (requerido: ≥${requiredCsPerMin})`
        : `Progreso: mejor CS/min ${bestCsPerMin.toFixed(1)} (requerido: ≥${requiredCsPerMin})`,
      snapshot: { bestCsPerMin, requiredCsPerMin },
    };
  }
}
