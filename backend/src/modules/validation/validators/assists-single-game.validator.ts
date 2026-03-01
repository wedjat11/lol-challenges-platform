import { Injectable } from '@nestjs/common';
import { IValidator, ValidatorResult, ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

@Injectable()
export class AssistsSingleGameValidator implements IValidator {
  readonly validatorKey = 'assists_single_game';

  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult {
    const requiredAssists = (params.assists as number) ?? 1;

    let qualifyingMatch: { matchId: string; assists: number; champion: string } | null = null;

    for (const match of matches) {
      const participant = match.info.participants.find((p) => p.puuid === context.targetPuuid);

      if (participant && participant.assists >= requiredAssists) {
        qualifyingMatch = {
          matchId: match.metadata.matchId,
          assists: participant.assists,
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
        ? `Completed: ${qualifyingMatch?.assists} assists in a single game (required: ${requiredAssists})`
        : `No game found with ${requiredAssists}+ assists`,
      snapshot: passed ? { qualifyingMatch } : undefined,
    };
  }
}
