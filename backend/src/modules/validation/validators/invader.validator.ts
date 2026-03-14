import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * INVASOR — Roba X campamentos de la jungla enemiga.
 * Usa challenges.enemyJungleMonsterKills (Match V5).
 */
@Injectable()
export class InvaderValidator implements IValidator {
  readonly validatorKey = 'invader';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredCamps = (params.camps as number) ?? 15;

    let totalCamps = 0;
    const details: Array<{ matchId: string; camps: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        const camps = p.challenges?.enemyJungleMonsterKills ?? 0;
        totalCamps += camps;
        if (camps > 0) {
          details.push({ matchId: match.metadata.matchId, camps });
        }
      }
    }

    const passed = totalCamps >= requiredCamps;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: details.length,
      reason: passed
        ? `Completado: ${totalCamps}/${requiredCamps} campamentos enemigos robados`
        : `Progreso: ${totalCamps}/${requiredCamps} campamentos enemigos robados`,
      snapshot: { totalCamps, details },
    };
  }
}
