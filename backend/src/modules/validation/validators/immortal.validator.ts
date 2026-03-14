import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * INMORTAL — Gana X partidas terminando con 0 muertes.
 * Condición: win == true AND deaths == 0
 */
@Injectable()
export class ImmortalValidator implements IValidator {
  readonly validatorKey = 'immortal';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredGames = (params.games as number) ?? 1;

    let qualifiedCount = 0;
    const details: Array<{ matchId: string; champion: string }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p && p.win && p.deaths === 0) {
        qualifiedCount++;
        details.push({ matchId: match.metadata.matchId, champion: p.championName });
      }
    }

    const passed = qualifiedCount >= requiredGames;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: ${qualifiedCount}/${requiredGames} victorias sin morir`
        : `Progreso: ${qualifiedCount}/${requiredGames} victorias sin morir`,
      snapshot: { details },
    };
  }
}
