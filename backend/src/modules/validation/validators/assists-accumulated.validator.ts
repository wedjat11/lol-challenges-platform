import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

@Injectable()
export class AssistsAccumulatedValidator implements IValidator {
  readonly validatorKey = 'assists_accumulated';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredAssists = (params.assists as number) ?? 1;
    const maxGames = (params.games as number) ?? 30;

    let totalAssists = 0;
    const gameDetails: Array<{ matchId: string; assists: number }> = [];

    const matchesToEvaluate = matches.slice(0, maxGames);

    for (const match of matchesToEvaluate) {
      const participant = match.info.participants.find((p) => p.puuid === context.targetPuuid);

      if (participant) {
        totalAssists += participant.assists;
        gameDetails.push({
          matchId: match.metadata.matchId,
          assists: participant.assists,
        });
      }
    }

    const passed = totalAssists >= requiredAssists;

    return {
      passed,
      matchesEvaluated: matchesToEvaluate.length,
      matchesQualified: gameDetails.length,
      reason: passed
        ? `Completed: ${totalAssists}/${requiredAssists} assists in ${matchesToEvaluate.length} games`
        : `Progress: ${totalAssists}/${requiredAssists} assists in ${matchesToEvaluate.length} games`,
      snapshot: { totalAssists, gameDetails },
    };
  }
}
