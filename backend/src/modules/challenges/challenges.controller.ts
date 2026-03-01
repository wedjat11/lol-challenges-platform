import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { OnboardingGuard } from '@/modules/auth/guards/onboarding.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { User } from '@/modules/users/entities';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { ChallengeStatus } from '@/common/enums';

@ApiTags('challenges')
@ApiBearerAuth()
@Controller('challenges')
@UseGuards(JwtAuthGuard, OnboardingGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateChallengeDto,
  ): Promise<{ id: string; status: string }> {
    const challenge = await this.challengesService.create(user.id, dto);
    return {
      id: challenge.id,
      status: challenge.status,
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('role') role: 'creator' | 'target' | 'all' = 'all',
    @Query('status') status?: ChallengeStatus,
  ): Promise<
    Array<{
      id: string;
      status: string;
      rewardAmount: number;
      createdAt: Date;
      creator: { id: string; username: string };
      target: { id: string; username: string };
      template: { id: string; name: string };
    }>
  > {
    const challenges = await this.challengesService.findByUser(user.id, role, status);
    return challenges.map((c) => ({
      id: c.id,
      status: c.status,
      rewardAmount: c.rewardAmount,
      createdAt: c.createdAt,
      creator: { id: c.creator.id, username: c.creator.username },
      target: { id: c.target.id, username: c.target.username },
      template: { id: c.template.id, name: c.template.name },
    }));
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{
    id: string;
    status: string;
    params: Record<string, unknown>;
    rewardAmount: number;
    expiresAt: Date | null;
    acceptedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    creator: { id: string; username: string };
    target: { id: string; username: string };
    template: { id: string; name: string; description: string };
  }> {
    const challenge = await this.challengesService.findById(id);

    // Only creator or target can view the challenge
    if (challenge.creatorId !== user.id && challenge.targetId !== user.id) {
      throw new ForbiddenException('You do not have access to view this challenge');
    }

    return {
      id: challenge.id,
      status: challenge.status,
      params: challenge.params,
      rewardAmount: challenge.rewardAmount,
      expiresAt: challenge.expiresAt,
      acceptedAt: challenge.acceptedAt,
      completedAt: challenge.completedAt,
      createdAt: challenge.createdAt,
      creator: { id: challenge.creator.id, username: challenge.creator.username },
      target: { id: challenge.target.id, username: challenge.target.username },
      template: {
        id: challenge.template.id,
        name: challenge.template.name,
        description: challenge.template.description,
      },
    };
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ id: string; status: string; acceptedAt: Date | null }> {
    const challenge = await this.challengesService.accept(id, user.id);
    return {
      id: challenge.id,
      status: challenge.status,
      acceptedAt: challenge.acceptedAt,
    };
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ id: string; status: string }> {
    const challenge = await this.challengesService.reject(id, user.id);
    return {
      id: challenge.id,
      status: challenge.status,
    };
  }

  @Post(':id/validate')
  @HttpCode(HttpStatus.ACCEPTED)
  async validate(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    await this.challengesService.triggerValidation(id, user.id);
    return { message: 'Validation queued' };
  }
}
