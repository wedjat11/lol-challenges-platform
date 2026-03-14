import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * FIRST BLOOD KING — Consigue la Primera Sangre en X partidas (firstBloodKill == true).
 */
@Injectable()
export class FirstBloodKingValidator implements IValidator {
  readonly validatorKey = 'first_blood_king';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredGames = (params.games as number) ?? 3;

    let qualifiedCount = 0;
    const details: Array<{ matchId: string; champion: string }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p?.firstBloodKill) {
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
        ? `Completado: Primera Sangre en ${qualifiedCount}/${requiredGames} partidas`
        : `Progreso: Primera Sangre en ${qualifiedCount}/${requiredGames} partidas`,
      snapshot: { details },
    };
  }
}
