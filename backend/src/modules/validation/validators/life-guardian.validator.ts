import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * GUARDIAN DE LA VIDA — Mantén un promedio de muertes menor a X en tus últimas partidas.
 * Requiere al least 5 partidas válidas para evaluar el promedio.
 */
@Injectable()
export class LifeGuardianValidator implements IValidator {
  readonly validatorKey = 'life_guardian';

  private static readonly MIN_GAMES_FOR_AVERAGE = 5;

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const maxAvgDeaths = (params.max_avg_deaths as number) ?? 3.0;

    const participantMatches = matches.filter((m) =>
      m.info.participants.some((x) => x.puuid === context.targetPuuid),
    );

    if (participantMatches.length < LifeGuardianValidator.MIN_GAMES_FOR_AVERAGE) {
      return {
        passed: false,
        matchesEvaluated: matches.length,
        matchesQualified: 0,
        reason: `Insuficientes partidas (${participantMatches.length}/${LifeGuardianValidator.MIN_GAMES_FOR_AVERAGE} mínimo para calcular promedio)`,
        snapshot: { gamesFound: participantMatches.length },
      };
    }

    const totalDeaths = participantMatches.reduce((sum, m) => {
      const p = m.info.participants.find((x) => x.puuid === context.targetPuuid);
      return sum + (p?.deaths ?? 0);
    }, 0);

    const avgDeaths = totalDeaths / participantMatches.length;
    const passed = avgDeaths < maxAvgDeaths;

    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: participantMatches.length,
      reason: passed
        ? `Completado: promedio de muertes ${avgDeaths.toFixed(2)} < ${maxAvgDeaths}`
        : `Progreso: promedio de muertes ${avgDeaths.toFixed(2)} (requerido: < ${maxAvgDeaths})`,
      snapshot: { avgDeaths, totalDeaths, gamesEvaluated: participantMatches.length },
    };
  }
}
