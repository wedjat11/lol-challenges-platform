import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * MAGNATE DE ORO — Acumula un total de X de oro (goldEarned) entre todas las partidas.
 */
@Injectable()
export class GoldTycoonValidator implements IValidator {
  readonly validatorKey = 'gold_tycoon';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredGold = (params.gold as number) ?? 150000;

    let totalGold = 0;
    const details: Array<{ matchId: string; gold: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        totalGold += p.goldEarned;
        details.push({ matchId: match.metadata.matchId, gold: p.goldEarned });
      }
    }

    const passed = totalGold >= requiredGold;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: details.length,
      reason: passed
        ? `Completado: ${totalGold.toLocaleString()}/${requiredGold.toLocaleString()} oro acumulado`
        : `Progreso: ${totalGold.toLocaleString()}/${requiredGold.toLocaleString()} oro acumulado`,
      snapshot: { totalGold, details },
    };
  }
}
