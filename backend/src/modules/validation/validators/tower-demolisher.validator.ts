import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * DEMOLEDOR DE TORRES — Destruye o asiste en la destrucción de X torretas.
 * Usa challenges.turretTakedowns (kills + assists) si disponible, sino turretKills.
 */
@Injectable()
export class TowerDemolisherValidator implements IValidator {
  readonly validatorKey = 'tower_demolisher';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredTowers = (params.towers as number) ?? 15;

    let totalTowers = 0;
    const details: Array<{ matchId: string; towers: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        // challenges.turretTakedowns includes kills + assists on turrets
        const towersThisGame = p.challenges?.turretTakedowns ?? p.turretKills;
        totalTowers += towersThisGame;
        if (towersThisGame > 0) {
          details.push({ matchId: match.metadata.matchId, towers: towersThisGame });
        }
      }
    }

    const passed = totalTowers >= requiredTowers;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: details.length,
      reason: passed
        ? `Completado: ${totalTowers}/${requiredTowers} torretas demolidas/asistidas`
        : `Progreso: ${totalTowers}/${requiredTowers} torretas demolidas/asistidas`,
      snapshot: { totalTowers, details },
    };
  }
}
