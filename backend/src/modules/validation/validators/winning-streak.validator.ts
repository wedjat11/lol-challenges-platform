import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * RACHA GANADORA — Gana X partidas consecutivas desde la fecha de aceptación.
 * Matches llegan ordenados más reciente primero.
 * Se mide la racha activa (desde la partida más reciente hacia atrás).
 */
@Injectable()
export class WinningStreakValidator implements IValidator {
  readonly validatorKey = 'winning_streak';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredStreak = (params.games as number) ?? 3;

    let currentStreak = 0;
    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (!p) break;
      if (p.win) {
        currentStreak++;
      } else {
        break; // streak broken
      }
    }

    const passed = currentStreak >= requiredStreak;
    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: currentStreak,
      reason: passed
        ? `Completado: racha ganadora activa de ${currentStreak} partidas (requerido: ${requiredStreak})`
        : `Progreso: racha ganadora activa ${currentStreak}/${requiredStreak} partidas`,
      snapshot: { currentStreak },
    };
  }
}
