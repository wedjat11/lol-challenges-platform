import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Challenge, ChallengeValidationLog } from '@/modules/challenges/entities';
import { RiotAccount } from '@/modules/users/entities';
import { RiotService, RiotMatch } from '@/modules/riot/riot.service';
import { EconomyService } from '@/modules/economy/economy.service';
import { ValidatorRegistry } from './validators/validator.registry';
import { ChallengeStatus, ValidationResult } from '@/common/enums';
import { ValidationContext } from './interfaces/validator.interface';
import { RedisConfig } from '@/config';

interface ValidationJobData {
  challengeId: string;
  userId: string;
  triggeredAt: string;
}

const VALID_QUEUE_IDS = [420, 440, 400]; // Ranked Solo/Duo, Ranked Flex, Normal Draft
const MIN_GAME_DURATION = 300; // 5 minutes
const VALID_GAME_MODES = ['CLASSIC', 'RANKED_SOLO', 'RANKED_FLEX'];

@Processor('challenge-validation')
export class ValidationProcessor extends WorkerHost implements OnModuleDestroy {
  private redis: Redis;

  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeValidationLog)
    private readonly validationLogRepository: Repository<ChallengeValidationLog>,
    @InjectRepository(RiotAccount)
    private readonly riotAccountRepository: Repository<RiotAccount>,
    private readonly riotService: RiotService,
    private readonly economyService: EconomyService,
    private readonly validatorRegistry: ValidatorRegistry,
    private readonly configService: ConfigService,
  ) {
    super();
    const redisConfig = this.configService.get<RedisConfig>('redis');
    if (!redisConfig) {
      throw new Error('Redis configuration not found');
    }
    this.redis = new Redis(redisConfig.url);
  }

  onModuleDestroy(): void {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  async process(job: Job<ValidationJobData>): Promise<void> {
    const { challengeId, userId } = job.data;
    console.log(`[ValidationWorker] Processing job for challenge ${challengeId}`);

    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
      relations: ['template'],
    });

    if (!challenge) {
      console.error(`[ValidationWorker] Challenge ${challengeId} not found`);
      await this.logValidation(challengeId, userId, ValidationResult.ERROR, 'Challenge not found');
      return;
    }

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      console.log(
        `[ValidationWorker] Challenge ${challengeId} is not active (status: ${challenge.status}), skipping`,
      );
      return;
    }

    const riotAccount = await this.riotAccountRepository.findOne({
      where: { userId: challenge.targetId },
    });

    if (!riotAccount) {
      console.error(
        `[ValidationWorker] Target user ${challenge.targetId} has no Riot account linked`,
      );
      await this.logValidation(
        challengeId,
        userId,
        ValidationResult.ERROR,
        'Target has no Riot account linked',
      );
      return;
    }

    try {
      console.log(`[ValidationWorker] Fetching match IDs for PUUID ${riotAccount.puuid}`);
      const matchIds = await this.getMatchIdsWithCache(riotAccount.puuid, 20);

      if (matchIds.length === 0) {
        console.log(`[ValidationWorker] No matches found for ${riotAccount.puuid}`);
        await this.logValidation(
          challengeId,
          userId,
          ValidationResult.FAIL,
          'No matches found',
          0,
          0,
        );
        return;
      }

      console.log(`[ValidationWorker] Found ${matchIds.length} match IDs, fetching details...`);
      const matches: RiotMatch[] = [];
      for (const matchId of matchIds) {
        try {
          const match = await this.getMatchWithCache(matchId);
          matches.push(match);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`[ValidationWorker] Failed to fetch match ${matchId}: ${errorMessage}`);
        }
      }

      if (matches.length === 0) {
        console.log(`[ValidationWorker] No valid matches could be fetched`);
        await this.logValidation(
          challengeId,
          userId,
          ValidationResult.FAIL,
          'No matches could be fetched',
          0,
          0,
        );
        return;
      }

      // Filter matches based on eligibility rules
      const qualifiedMatches = this.filterEligibleMatches(
        matches,
        challenge.acceptedAt ?? new Date(),
        riotAccount.puuid,
      );

      console.log(
        `[ValidationWorker] Challenge eligibility: ${matches.length} total matches, ${qualifiedMatches.length} eligible`,
      );

      const validator = this.validatorRegistry.get(challenge.template.validatorKey);

      if (!validator) {
        console.error(`[ValidationWorker] Unknown validator: ${challenge.template.validatorKey}`);
        await this.logValidation(
          challengeId,
          userId,
          ValidationResult.ERROR,
          `Unknown validator: ${challenge.template.validatorKey}`,
        );
        return;
      }

      const context: ValidationContext = {
        challengeId,
        creatorId: challenge.creatorId,
        targetId: challenge.targetId,
        targetPuuid: riotAccount.puuid,
        acceptedAt: challenge.acceptedAt ?? new Date(),
        rewardAmount: challenge.rewardAmount,
      };

      const result = validator.evaluate(qualifiedMatches, challenge.params, context);

      console.log(
        `[ValidationWorker] Validation result: ${result.passed ? 'PASS' : 'FAIL'} - ${result.reason}`,
      );

      await this.logValidation(
        challengeId,
        userId,
        result.passed ? ValidationResult.PASS : ValidationResult.FAIL,
        result.reason,
        result.matchesEvaluated,
        result.matchesQualified,
        result.snapshot,
      );

      if (result.passed) {
        console.log(`[ValidationWorker] Marking challenge ${challengeId} as COMPLETED`);
        challenge.status = ChallengeStatus.COMPLETED;
        challenge.completedAt = new Date();
        await this.challengeRepository.save(challenge);

        console.log(
          `[ValidationWorker] Crediting ${challenge.rewardAmount} coins to user ${challenge.targetId}`,
        );
        await this.economyService.creditForChallengeCompletion(
          challenge.targetId,
          challengeId,
          challenge.rewardAmount,
        );
      }
    } catch (error) {
      if (this.isRiotApiKeyExpired(error)) {
        console.error(
          `[ValidationWorker] Riot API key expired - not retrying job for challenge ${challengeId}`,
        );
        await this.logValidation(
          challengeId,
          userId,
          ValidationResult.ERROR,
          'Riot API key expired',
        );
        // Request will be removed after max attempts automatically by BullMQ
        throw error; // Still throw to mark job as failed, but won't retry by external trigger
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[ValidationWorker] Error processing challenge ${challengeId}: ${errorMessage}`,
      );
      await this.logValidation(challengeId, userId, ValidationResult.ERROR, errorMessage);

      // Re-throw to allow BullMQ retry mechanism to kick in for transient errors
      throw error;
    }
  }

  private async getMatchIdsWithCache(puuid: string, count: number): Promise<string[]> {
    const cacheKey = `matchids:${puuid}`;
    const redisConfig = this.configService.get<RedisConfig>('redis');
    const cacheTtl = redisConfig?.cacheTtlMatchlist ?? 90;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log(`[ValidationWorker] Cache HIT for match list ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn(`[ValidationWorker] Redis get failed: ${error}`);
      // Continue with API call on cache miss/error
    }

    console.log(`[ValidationWorker] Cache MISS for match list ${cacheKey}, fetching from API`);
    const matchIds = await this.riotService.getMatchIds(puuid, count);

    try {
      await this.redis.setex(cacheKey, cacheTtl, JSON.stringify(matchIds));
    } catch (error) {
      console.warn(`[ValidationWorker] Redis set failed: ${error}`);
      // Continue even if cache write fails
    }

    return matchIds;
  }

  private async getMatchWithCache(matchId: string): Promise<RiotMatch> {
    const cacheKey = `match:${matchId}`;
    const redisConfig = this.configService.get<RedisConfig>('redis');
    const cacheTtl = redisConfig?.cacheTtlMatch ?? 86400;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log(`[ValidationWorker] Cache HIT for match ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn(`[ValidationWorker] Redis get failed for match ${matchId}: ${error}`);
      // Continue with API call
    }

    console.log(`[ValidationWorker] Cache MISS for match ${cacheKey}, fetching from API`);
    const match = await this.riotService.getMatch(matchId);

    try {
      await this.redis.setex(cacheKey, cacheTtl, JSON.stringify(match));
    } catch (error) {
      console.warn(`[ValidationWorker] Redis set failed for match ${matchId}: ${error}`);
      // Continue even if cache write fails
    }

    return match;
  }

  private filterEligibleMatches(
    matches: RiotMatch[],
    acceptedAt: Date,
    targetPuuid: string,
  ): RiotMatch[] {
    const acceptedAtMs = acceptedAt.getTime();

    return matches.filter((match) => {
      // Rule 1: Match must start after challenge was accepted
      if (match.info.gameStartTimestamp < acceptedAtMs) {
        return false;
      }

      // Rule 2: Minimum game duration (exclude remakes)
      if (match.info.gameDuration < MIN_GAME_DURATION) {
        return false;
      }

      // Rule 3: Valid game mode
      if (!VALID_GAME_MODES.includes(match.info.gameMode)) {
        return false;
      }

      // Rule 4: Valid queue ID
      if (!VALID_QUEUE_IDS.includes(match.info.queueId)) {
        return false;
      }

      // Rule 5: Target PUUID must be in match participants
      if (!match.metadata.participants.includes(targetPuuid)) {
        return false;
      }

      return true;
    });
  }

  private isRiotApiKeyExpired(error: unknown): boolean {
    if (error instanceof Error) {
      // Check if error message contains 403 or key-related error
      return (
        error.message.includes('403') ||
        error.message.includes('RIOT_API_KEY_INVALID') ||
        error.message.includes('API key is invalid or expired')
      );
    }

    // Also check if it's a BadRequestException-like object
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return (
        err.statusCode === 403 ||
        err.code === 'RIOT_API_KEY_INVALID' ||
        (typeof err.message === 'string' &&
          (err.message.includes('403') || err.message.includes('key')))
      );
    }

    return false;
  }

  private async logValidation(
    challengeId: string,
    triggeredBy: string,
    result: ValidationResult,
    reason: string,
    matchesEvaluated = 0,
    matchesQualified = 0,
    snapshot?: Record<string, unknown>,
  ): Promise<void> {
    const log = this.validationLogRepository.create({
      challengeId,
      triggeredBy,
      result,
      reason,
      matchesEvaluated,
      matchesQualified,
      riotApiSnapshot: snapshot ?? null,
    });
    await this.validationLogRepository.save(log);
  }
}
