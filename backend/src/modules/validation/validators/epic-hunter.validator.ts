import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * CAZADOR ÉPICO — Participa en la muerte de X monstruos épicos (Dragones/Barones/Heraldos).
 * Usa challenges.dragonTakedowns + challenges.baronTakedowns + challenges.riftHeraldTakedowns.
 */
@Injectable()
export class EpicHunterValidator implements IValidator {
  readonly validatorKey = 'epic_hunter';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredMonsters = (params.monsters as number) ?? 10;

    let totalMonsters = 0;
    const details: Array<{ matchId: string; dragons: number; barons: number; heralds: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        const dragons = p.challenges?.dragonTakedowns ?? 0;
        const barons = p.challenges?.baronTakedowns ?? 0;
        const heralds = p.challenges?.riftHeraldTakedowns ?? 0;
        const total = dragons + barons + heralds;

        totalMonsters += total;
        if (total > 0) {
          details.push({ matchId: match.metadata.matchId, dragons, barons, heralds });
        }
      }
    }

    const passed = totalMonsters >= requiredMonsters;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: details.length,
      reason: passed
        ? `Completado: ${totalMonsters}/${requiredMonsters} monstruos épicos eliminados`
        : `Progreso: ${totalMonsters}/${requiredMonsters} monstruos épicos eliminados`,
      snapshot: { totalMonsters, details },
    };
  }
}
