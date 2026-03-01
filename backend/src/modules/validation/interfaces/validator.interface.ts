import { RiotMatch } from '@/modules/riot/riot.service';

export interface ValidatorResult {
  passed: boolean;
  matchesEvaluated: number;
  matchesQualified: number;
  reason: string;
  snapshot?: Record<string, unknown>;
}

export interface ValidationContext {
  challengeId: string;
  creatorId: string;
  targetId: string;
  targetPuuid: string;
  acceptedAt: Date;
  rewardAmount: number;
}

export interface IValidator {
  readonly validatorKey: string;
  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult;
}
