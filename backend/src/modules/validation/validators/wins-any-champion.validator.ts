import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

@Injectable()
export class WinsAnyChampionValidator implements IValidator {
  readonly validatorKey = 'wins_any_champion';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredGames = (params.games as number) ?? 1;

    let winsCount = 0;
    const winDetails: Array<{ matchId: string; champion: string }> = [];

    for (const match of matches) {
      const participant = match.info.participants.find((p) => p.puuid === context.targetPuuid);

      if (participant?.win) {
        winsCount++;
        winDetails.push({
          matchId: match.metadata.matchId,
          champion: participant.championName,
        });
      }

      if (winsCount >= requiredGames) {
        break;
      }
    }

    const passed = winsCount >= requiredGames;

    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: winsCount,
      reason: passed
        ? `Completed: ${winsCount}/${requiredGames} wins`
        : `Progress: ${winsCount}/${requiredGames} wins`,
      snapshot: { winDetails },
    };
  }
}
