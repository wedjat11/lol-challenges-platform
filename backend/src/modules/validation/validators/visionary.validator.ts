import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * VISIONARIO — Logra una puntuación de visión (visionScore) superior a X en Y partidas.
 */
@Injectable()
export class VisionaryValidator implements IValidator {
  readonly validatorKey = 'visionary';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredVisionScore = (params.vision_score as number) ?? 40;
    const requiredGames = (params.games as number) ?? 3;

    let qualifiedCount = 0;
    const details: Array<{ matchId: string; visionScore: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p && p.visionScore > requiredVisionScore) {
        qualifiedCount++;
        details.push({ matchId: match.metadata.matchId, visionScore: p.visionScore });
      }
    }

    const passed = qualifiedCount >= requiredGames;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: visión >${requiredVisionScore} en ${qualifiedCount}/${requiredGames} partidas`
        : `Progreso: visión >${requiredVisionScore} en ${qualifiedCount}/${requiredGames} partidas`,
      snapshot: { details },
    };
  }
}
