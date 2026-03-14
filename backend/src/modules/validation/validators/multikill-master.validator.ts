import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

type MultikillType = 'double' | 'triple' | 'quadra' | 'penta';

/**
 * MAESTRO DE MULTIKILLS — Consigue al menos una multikill del tipo indicado
 * en X partidas distintas.
 * multikill_type: "double" | "triple" | "quadra" | "penta"
 * La condición es aditiva: penta también cuenta como triple y double.
 */
@Injectable()
export class MultikillMasterValidator implements IValidator {
  readonly validatorKey = 'multikill_master';

  private getMultikillCount(
    participant: {
      doubleKills: number;
      tripleKills: number;
      quadraKills: number;
      pentaKills: number;
    },
    type: MultikillType,
  ): number {
    switch (type) {
      case 'double': return participant.doubleKills;
      case 'triple': return participant.tripleKills;
      case 'quadra': return participant.quadraKills;
      case 'penta':  return participant.pentaKills;
    }
  }

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredGames = (params.games as number) ?? 3;
    const multikillType = (params.multikill_type as MultikillType) ?? 'double';

    let qualifiedGames = 0;
    const details: Array<{ matchId: string; count: number }> = [];

    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (p) {
        const count = this.getMultikillCount(p, multikillType);
        if (count > 0) {
          qualifiedGames++;
          details.push({ matchId: match.metadata.matchId, count });
        }
      }
    }

    const passed = qualifiedGames >= requiredGames;
    const typeLabel = { double: 'Doble Kill', triple: 'Triple Kill', quadra: 'Cuádruple Kill', penta: 'Penta Kill' }[multikillType];

    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: qualifiedGames,
      reason: passed
        ? `Completado: ${typeLabel} en ${qualifiedGames}/${requiredGames} partidas`
        : `Progreso: ${typeLabel} en ${qualifiedGames}/${requiredGames} partidas`,
      snapshot: { multikillType, details },
    };
  }
}
