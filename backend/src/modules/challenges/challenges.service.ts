import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Challenge, ChallengeTemplate, ChallengeValidationLog } from './entities';
import { ChallengeStatus } from '@/common/enums';
import { EconomyService } from '@/modules/economy/economy.service';
import { EconomyConfig } from '@/config';
import { CreateChallengeDto } from './dto/create-challenge.dto';

function evaluateRewardFormula(formula: string, params: Record<string, unknown>): number {
  let expression = formula.trim();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'number') {
      expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
    }
  }

  // Only allow simple "number op number" or just "number" expressions
  const single = /^(\d+(?:\.\d+)?)$/.exec(expression);
  if (single) {
    return Math.max(1, Math.floor(parseFloat(single[1])));
  }

  const binary = /^(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)$/.exec(expression);
  if (binary) {
    const left = parseFloat(binary[1]);
    const op = binary[2];
    const right = parseFloat(binary[3]);
    let result: number;
    if (op === '*') result = left * right;
    else if (op === '/') result = right !== 0 ? left / right : 1;
    else if (op === '+') result = left + right;
    else result = left - right;
    return Math.max(1, Math.floor(result));
  }

  return 1;
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeTemplate)
    private readonly templateRepository: Repository<ChallengeTemplate>,
    @InjectRepository(ChallengeValidationLog)
    private readonly validationLogRepository: Repository<ChallengeValidationLog>,
    @InjectQueue('challenge-validation')
    private readonly validationQueue: Queue,
    private readonly economyService: EconomyService,
    private readonly configService: ConfigService,
  ) {}

  async create(creatorId: string, dto: CreateChallengeDto): Promise<Challenge> {
    if (creatorId === dto.targetId) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'SELF_CHALLENGE',
        message: 'You cannot challenge yourself',
      });
    }

    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId, isActive: true },
    });

    if (!template) {
      throw new NotFoundException('Challenge template not found');
    }

    const rewardAmount = evaluateRewardFormula(template.rewardFormula, dto.params);

    // Create challenge first to get the ID
    const challenge = this.challengeRepository.create({
      creatorId,
      targetId: dto.targetId,
      templateId: dto.templateId,
      params: dto.params,
      rewardAmount,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    const savedChallenge = await this.challengeRepository.save(challenge);

    // Deduct coins for challenge creation
    await this.economyService.deductForChallengeCreation(creatorId, savedChallenge.id);

    return savedChallenge;
  }

  async findById(id: string): Promise<Challenge> {
    const challenge = await this.challengeRepository.findOne({
      where: { id },
      relations: ['creator', 'target', 'template'],
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  async findByUser(
    userId: string,
    role: 'creator' | 'target' | 'all',
    status?: ChallengeStatus,
  ): Promise<Challenge[]> {
    const query = this.challengeRepository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.creator', 'creator')
      .leftJoinAndSelect('challenge.target', 'target')
      .leftJoinAndSelect('challenge.template', 'template');

    if (role === 'creator') {
      query.where('challenge.creatorId = :userId', { userId });
    } else if (role === 'target') {
      query.where('challenge.targetId = :userId', { userId });
    } else {
      query.where('(challenge.creatorId = :userId OR challenge.targetId = :userId)', { userId });
    }

    if (status) {
      query.andWhere('challenge.status = :status', { status });
    }

    query.orderBy('challenge.createdAt', 'DESC');

    return query.getMany();
  }

  async accept(challengeId: string, userId: string): Promise<Challenge> {
    const challenge = await this.findById(challengeId);

    if (challenge.targetId !== userId) {
      throw new ForbiddenException('Only the target can accept this challenge');
    }

    if (challenge.status !== ChallengeStatus.PENDING_ACCEPTANCE) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        code: 'CHALLENGE_NOT_PENDING',
        message: 'Challenge is not pending acceptance',
      });
    }

    challenge.status = ChallengeStatus.ACTIVE;
    challenge.acceptedAt = new Date();

    return this.challengeRepository.save(challenge);
  }

  async reject(challengeId: string, userId: string): Promise<Challenge> {
    const challenge = await this.findById(challengeId);

    if (challenge.targetId !== userId) {
      throw new ForbiddenException('Only the target can reject this challenge');
    }

    if (challenge.status !== ChallengeStatus.PENDING_ACCEPTANCE) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        code: 'CHALLENGE_NOT_PENDING',
        message: 'Challenge is not pending acceptance',
      });
    }

    challenge.status = ChallengeStatus.CANCELLED;

    await this.challengeRepository.save(challenge);

    // MVP policy: NO refund when rejecting
    // await this.economyService.refundChallengeCancellation(challenge.creatorId, challengeId);

    return challenge;
  }

  async triggerValidation(challengeId: string, userId: string): Promise<void> {
    const challenge = await this.findById(challengeId);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        code: 'CHALLENGE_NOT_ACTIVE',
        message: 'Challenge is not active',
      });
    }

    // Check cooldown
    const economyConfig = this.configService.get<EconomyConfig>('economy');
    const cooldownMinutes = economyConfig?.validationCooldownMinutes ?? 10;

    const lastValidation = await this.validationLogRepository.findOne({
      where: { challengeId },
      order: { createdAt: 'DESC' },
    });

    if (lastValidation) {
      const cooldownEnd = new Date(
        lastValidation.createdAt.getTime() + cooldownMinutes * 60 * 1000,
      );
      if (new Date() < cooldownEnd) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          code: 'VALIDATION_COOLDOWN',
          message: `Validation cooldown active. Try again after ${cooldownEnd.toISOString()}`,
        });
      }
    }

    // Enqueue validation job
    await this.validationQueue.add(
      'validate-challenge',
      {
        challengeId,
        userId,
        triggeredAt: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
      },
    );
  }

  async getTemplates(): Promise<ChallengeTemplate[]> {
    return this.templateRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getTemplateById(id: string): Promise<ChallengeTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }
}
