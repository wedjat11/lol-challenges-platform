import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, RiotAccount } from '@/modules/users/entities';
import { ChallengeTemplate } from '@/modules/challenges/entities';
import { CoinTransaction } from '@/modules/economy/entities';
import { EconomyService } from '@/modules/economy/economy.service';
import {
  AdminUserFilterDto,
  UpdateUserStatusDto,
  GrantCoinsDto,
  DeductCoinsDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  AdminUserResponseDto,
} from './dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RiotAccount)
    private readonly riotAccountRepository: Repository<RiotAccount>,
    @InjectRepository(ChallengeTemplate)
    private readonly templateRepository: Repository<ChallengeTemplate>,
    @InjectRepository(CoinTransaction)
    private readonly coinTransactionRepository: Repository<CoinTransaction>,
    private readonly economyService: EconomyService,
  ) {}

  async listUsers(
    filter: AdminUserFilterDto,
  ): Promise<{ users: AdminUserResponseDto[]; cursor: string | null }> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.riotAccount', 'riotAccount');

    if (filter.search) {
      query.where('user.username ILIKE :search OR user.email ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.hasRiotAccount !== undefined) {
      query.andWhere('user.has_riot_account = :hasRiotAccount', {
        hasRiotAccount: filter.hasRiotAccount,
      });
    }

    if (filter.isActive !== undefined) {
      query.andWhere('user.is_active = :isActive', {
        isActive: filter.isActive,
      });
    }

    query.orderBy('user.created_at', 'DESC').take(filter.limit + 1);

    if (filter.cursor) {
      query.andWhere('user.created_at < :cursor', {
        cursor: new Date(Buffer.from(filter.cursor, 'base64').toString()),
      });
    }

    const users = await query.getMany();
    let nextCursor: string | null = null;

    if (users.length > filter.limit) {
      const lastUser = users[filter.limit - 1];
      nextCursor = Buffer.from(lastUser.createdAt.toISOString()).toString('base64');
      users.pop();
    }

    return {
      users: users.map((user) => this.mapUserToResponse(user)),
      cursor: nextCursor,
    };
  }

  async getUserDetail(userId: string): Promise<{
    user: AdminUserResponseDto;
    transactions: CoinTransaction[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['riotAccount'],
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    const transactions = await this.coinTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      user: this.mapUserToResponse(user),
      transactions,
    };
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto): Promise<AdminUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['riotAccount'],
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    user.isActive = dto.isActive;
    await this.userRepository.save(user);

    console.log(
      `[AdminService] User ${userId} status updated to ${dto.isActive} - Reason: ${dto.reason}`,
    );

    return this.mapUserToResponse(user);
  }

  async grantCoins(
    adminId: string,
    dto: GrantCoinsDto,
  ): Promise<{
    transaction: CoinTransaction;
    user: AdminUserResponseDto;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: ['riotAccount'],
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    await this.economyService.adminGrant(adminId, dto.userId, dto.amount, dto.notes);

    const transaction = await this.coinTransactionRepository.findOne({
      where: { userId: dto.userId },
      order: { createdAt: 'DESC' },
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: ['riotAccount'],
    });

    return {
      transaction: transaction!,
      user: this.mapUserToResponse(updatedUser!),
    };
  }

  async deductCoins(
    adminId: string,
    dto: DeductCoinsDto,
  ): Promise<{
    transaction: CoinTransaction;
    user: AdminUserResponseDto;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: ['riotAccount'],
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    if (user.balance < dto.amount) {
      throw new BadRequestException({
        statusCode: 422,
        code: 'INSUFFICIENT_FUNDS',
        message: `User has insufficient balance. Has ${user.balance}, trying to deduct ${dto.amount}.`,
      });
    }

    await this.economyService.adminDeduct(adminId, dto.userId, dto.amount, dto.notes);

    const transaction = await this.coinTransactionRepository.findOne({
      where: { userId: dto.userId },
      order: { createdAt: 'DESC' },
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: ['riotAccount'],
    });

    return {
      transaction: transaction!,
      user: this.mapUserToResponse(updatedUser!),
    };
  }

  async createTemplate(dto: CreateTemplateDto): Promise<ChallengeTemplate> {
    const existing = await this.templateRepository.findOne({
      where: { validatorKey: dto.validatorKey },
    });

    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        code: 'VALIDATOR_KEY_EXISTS',
        message: 'Validator key already exists',
      });
    }

    const template = this.templateRepository.create({
      name: dto.name,
      description: dto.description,
      validatorKey: dto.validatorKey,
      paramSchema: dto.paramSchema,
      rewardFormula: dto.rewardFormula,
      isActive: dto.isActive,
    });

    return this.templateRepository.save(template);
  }

  async updateTemplate(templateId: string, dto: UpdateTemplateDto): Promise<ChallengeTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Template not found',
      });
    }

    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.paramSchema !== undefined) template.paramSchema = dto.paramSchema;
    if (dto.rewardFormula !== undefined) template.rewardFormula = dto.rewardFormula;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;

    return this.templateRepository.save(template);
  }

  private mapUserToResponse(user: User): AdminUserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      hasRiotAccount: user.hasRiotAccount,
      isActive: user.isActive,
      role: user.role,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      riotAccount: user.riotAccount
        ? {
            puuid: user.riotAccount.puuid,
            gameName: user.riotAccount.gameName,
            tagLine: user.riotAccount.tagLine,
            region: user.riotAccount.region,
            isVerified: user.riotAccount.isVerified,
          }
        : null,
    };
  }
}
