import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

/**
 * RACHA DE INVICTO — Logra una racha de X partidas consecutivas sin morir.
 * Matches llegan ordenados del más reciente al más antiguo.
 * Se busca la racha activa (a partir de la partida más reciente).
 */
@Injectable()
export class DeathlessStreakValidator implements IValidator {
  readonly validatorKey = 'deathless_streak';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredStreak = (params.games as number) ?? 2;

    // Current streak: count consecutive games from most recent without a death
    let currentStreak = 0;
    for (const match of matches) {
      const p = match.info.participants.find((x) => x.puuid === context.targetPuuid);
      if (!p) break;
      if (p.deaths === 0) {
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
        ? `Completado: racha activa de ${currentStreak} partidas sin morir (requerido: ${requiredStreak})`
        : `Progreso: racha activa de ${currentStreak}/${requiredStreak} partidas sin morir`,
      snapshot: { currentStreak },
    };
  }
}
