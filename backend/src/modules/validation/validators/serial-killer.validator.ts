import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * ASESINO SERIAL — Acumula un total de X kills en todas las partidas válidas.
 */
@Injectable()
export class SerialKillerValidator implements IValidator {
  readonly validatorKey = 'serial_killer';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredKills = (params.kills as number) ?? 50;

    let totalKills = 0;
    const details: Array<{ matchId: string; kills: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        totalKills += p.kills;
        details.push({ matchId: match.metadata.matchId, kills: p.kills });
      }
    }

    const passed = totalKills >= requiredKills;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: details.length,
      reason: passed
        ? `Completado: ${totalKills}/${requiredKills} kills acumulados`
        : `Progreso: ${totalKills}/${requiredKills} kills acumulados`,
      snapshot: { totalKills, details },
    };
  }
}
