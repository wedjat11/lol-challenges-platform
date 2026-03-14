import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * DAÑO EXPLOSIVO — Inflige más de X de daño a campeones (totalDamageDealtToChampions)
 * en UNA sola partida.
 */
@Injectable()
export class ExplosiveDamageValidator implements IValidator {
  readonly validatorKey = 'explosive_damage';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredDamage = (params.damage as number) ?? 30000;

    let bestDamage = 0;
    let qualifiedCount = 0;

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        if (p.totalDamageDealtToChampions > bestDamage) {
          bestDamage = p.totalDamageDealtToChampions;
        }
        if (p.totalDamageDealtToChampions > requiredDamage) {
          qualifiedCount++;
        }
      }
    }

    const passed = qualifiedCount >= 1;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedCount,
      reason: passed
        ? `Completado: ${bestDamage.toLocaleString()} de daño en una partida (requerido: >${requiredDamage.toLocaleString()})`
        : `Progreso: mejor partida ${bestDamage.toLocaleString()} daño (requerido: >${requiredDamage.toLocaleString()})`,
      snapshot: { bestDamage, requiredDamage },
    };
  }
}
