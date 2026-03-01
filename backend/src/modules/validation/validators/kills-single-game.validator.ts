import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

@Injectable()
export class KillsSingleGameValidator implements IValidator {
  readonly validatorKey = 'kills_single_game';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredKills = (params.kills as number) ?? 1;

    let qualifyingMatch: { matchId: string; kills: number; champion: string } | null = null;

    for (const match of matches) {
      const participant = match.info.participants.find((p) => p.puuid === context.targetPuuid);

      if (participant && participant.kills >= requiredKills) {
        qualifyingMatch = {
          matchId: match.metadata.matchId,
          kills: participant.kills,
          champion: participant.championName,
        };
        break;
      }
    }

    const passed = qualifyingMatch !== null;

    return {
      passed,
      matchesEvaluated: matches.length,
      matchesQualified: passed ? 1 : 0,
      reason: passed
        ? `Completed: ${qualifyingMatch?.kills} kills in a single game (required: ${requiredKills})`
        : `No game found with ${requiredKills}+ kills`,
      snapshot: passed ? { qualifyingMatch } : undefined,
    };
  }
}
