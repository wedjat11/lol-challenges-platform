import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * TANQUE ABSOLUTO — Mitiga un total de X de daño (damageSelfMitigated) en UNA sola partida.
 */
@Injectable()
export class AbsoluteTankValidator implements IValidator {
  readonly validatorKey = 'absolute_tank';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredMitigation = (params.damage as number) ?? 50000;

    let bestMitigation = 0;
    let qualifiedCount = 0;

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        if (p.damageSelfMitigated > bestMitigation) bestMitigation = p.damageSelfMitigated;
        if (p.damageSelfMitigated >= requiredMitigation) qualifiedCount++;
      }
    }

    const passed = qualifiedCount >= 1;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: ${bestMitigation.toLocaleString()} daño mitigado en una partida (requerido: ≥${requiredMitigation.toLocaleString()})`
        : `Progreso: mejor mitigación ${bestMitigation.toLocaleString()} (requerido: ≥${requiredMitigation.toLocaleString()})`,
      snapshot: { bestMitigation, requiredMitigation },
    };
  }
}
