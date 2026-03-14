import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * ESCAPISTA — Termina X partidas teniendo como máximo Y muertes.
 * Condición: deaths <= max_deaths
 */
@Injectable()
export class EscapistValidator implements IValidator {
  readonly validatorKey = 'escapist';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredGames = (params.games as number) ?? 3;
    const maxDeaths = (params.max_deaths as number) ?? 3;

    let qualifiedCount = 0;
    const details: Array<{ matchId: string; deaths: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p && p.deaths <= maxDeaths) {
        qualifiedCount++;
        details.push({ matchId: match.metadata.matchId, deaths: p.deaths });
      }
    }

    const passed = qualifiedCount >= requiredGames;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: ${qualifiedCount}/${requiredGames} partidas con ≤${maxDeaths} muertes`
        : `Progreso: ${qualifiedCount}/${requiredGames} partidas con ≤${maxDeaths} muertes`,
      snapshot: { details },
    };
  }
}
