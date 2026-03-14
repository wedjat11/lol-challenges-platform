import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * SOPORTE DE ÉLITE — Logra un total de X asistencias en tus partidas válidas.
 */
@Injectable()
export class EliteSupportValidator implements IValidator {
  readonly validatorKey = 'elite_support';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredAssists = (params.assists as number) ?? 50;

    let totalAssists = 0;
    const details: Array<{ matchId: string; assists: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        totalAssists += p.assists;
        details.push({ matchId: match.metadata.matchId, assists: p.assists });
      }
    }

    const passed = totalAssists >= requiredAssists;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: details.length,
      reason: passed
        ? `Completado: ${totalAssists}/${requiredAssists} asistencias acumuladas`
        : `Progreso: ${totalAssists}/${requiredAssists} asistencias acumuladas`,
      snapshot: { totalAssists, details },
    };
  }
}
