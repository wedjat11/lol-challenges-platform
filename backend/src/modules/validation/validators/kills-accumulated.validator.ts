import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

@Injectable()
export class KillsAccumulatedValidator implements IValidator {
  readonly validatorKey = 'kills_accumulated';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredKills = (params.kills as number) ?? 1;
    const maxGames = (params.games as number) ?? 30;

    let totalKills = 0;
    const gameDetails: Array<{ matchId: string; kills: number }> = [];

    const matchesToEvaluate = matches.slice(0, maxGames);

    for (const match of matchesToEvaluate) {
      const participant = match.info.participants.find((p) => p.puuid === context.targetPuuid);

      if (participant) {
        totalKills += participant.kills;
        gameDetails.push({
          matchId: match.metadata.matchId,
          kills: participant.kills,
        });
      }
    }

    const passed = totalKills >= requiredKills;

    return {
      passed,
      matchesEvaluated: matchesToEvaluate.length,
      matchesQualified: gameDetails.length,
      reason: passed
        ? `Completed: ${totalKills}/${requiredKills} kills in ${matchesToEvaluate.length} games`
        : `Progress: ${totalKills}/${requiredKills} kills in ${matchesToEvaluate.length} games`,
      snapshot: { totalKills, gameDetails },
    };
  }
}
