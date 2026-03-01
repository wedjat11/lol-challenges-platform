import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

@Injectable()
export class WinsWithChampionValidator implements IValidator {
  readonly validatorKey = 'wins_with_champion';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredGames = (params.games as number) ?? 1;
    const requiredChampion = ((params.champion as string) ?? '').toLowerCase();

    let winsCount = 0;
    const winDetails: Array<{ matchId: string; champion: string }> = [];

    for (const match of matches) {
      const participant = match.info.participants.find((p) => p.puuid === context.targetPuuid);

      if (participant?.win && participant.championName.toLowerCase() === requiredChampion) {
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
        ? `Completed: ${winsCount}/${requiredGames} wins with ${requiredChampion}`
        : `Progress: ${winsCount}/${requiredGames} wins with ${requiredChampion}`,
      snapshot: { winDetails, requiredChampion },
    };
  }
}
