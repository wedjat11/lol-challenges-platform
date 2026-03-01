import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, RiotAccount } from './entities';
import { RiotService } from '@/modules/riot/riot.service';
import { LinkRiotAccountDto } from './dto';

interface RiotAccountResponse {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  isVerified: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RiotAccount)
    private readonly riotAccountRepository: Repository<RiotAccount>,
    private readonly riotService: RiotService,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['riotAccount'],
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.riotAccount', 'riotAccount')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.hasRiotAccount = :hasRiot', { hasRiot: true });

    // Check if query contains '#' -> search by gameName#tagLine
    if (query.includes('#')) {
      const [gameName, tagLine] = query.split('#');
      if (gameName && tagLine) {
        queryBuilder.andWhere(
          'LOWER(riotAccount.gameName) LIKE LOWER(:gameName) AND LOWER(riotAccount.tagLine) LIKE LOWER(:tagLine)',
          {
            gameName: `%${gameName}%`,
            tagLine: `%${tagLine}%`,
          },
        );
      } else if (gameName) {
        queryBuilder.andWhere('LOWER(riotAccount.gameName) LIKE LOWER(:gameName)', {
          gameName: `%${gameName}%`,
        });
      }
    } else {
      // Search by username (partial match)
      queryBuilder.andWhere('LOWER(user.username) LIKE LOWER(:query)', {
        query: `%${query}%`,
      });
    }

    return queryBuilder.limit(20).getMany();
  }

  async getRiotAccount(userId: string): Promise<RiotAccount> {
    const riotAccount = await this.riotAccountRepository.findOne({
      where: { userId },
    });

    if (!riotAccount) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'RIOT_ACCOUNT_NOT_FOUND',
        message: 'No Riot account linked to this user',
      });
    }

    return riotAccount;
  }

  async linkRiotAccount(userId: string, dto: LinkRiotAccountDto): Promise<RiotAccountResponse> {
    // Check if user already has a Riot account linked
    const existingAccount = await this.riotAccountRepository.findOne({
      where: { userId },
    });

    if (existingAccount) {
      throw new ConflictException({
        statusCode: 409,
        code: 'RIOT_ACCOUNT_ALREADY_LINKED',
        message: 'User already has a Riot account linked. Use PATCH to update.',
      });
    }

    return this.verifyAndLinkRiotAccount(userId, dto, false);
  }

  async updateRiotAccount(userId: string, dto: LinkRiotAccountDto): Promise<RiotAccountResponse> {
    // Check if user has a Riot account to update
    const existingAccount = await this.riotAccountRepository.findOne({
      where: { userId },
    });

    if (!existingAccount) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'RIOT_ACCOUNT_NOT_FOUND',
        message: 'No Riot account to update. Use POST to link a new account.',
      });
    }

    return this.verifyAndLinkRiotAccount(userId, dto, true);
  }

  private async verifyAndLinkRiotAccount(
    userId: string,
    dto: LinkRiotAccountDto,
    isUpdate: boolean,
  ): Promise<RiotAccountResponse> {
    // Verify with Riot API
    let riotAccountData: { puuid: string; gameName: string; tagLine: string };

    try {
      riotAccountData = await this.riotService.getAccountByRiotId(dto.gameName, dto.tagLine);
    } catch (error) {
      if (error instanceof BadRequestException) {
        const errorResponse = error.getResponse() as { code?: string };
        if (errorResponse.code === 'RIOT_NOT_FOUND') {
          throw new NotFoundException({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: `Riot account ${dto.gameName}#${dto.tagLine} not found`,
          });
        }
        throw error;
      }
      throw new BadRequestException({
        statusCode: 400,
        code: 'RIOT_VERIFICATION_FAILED',
        message: 'Failed to verify Riot account',
      });
    }

    // Check if PUUID is already linked to another user
    const existingPuuid = await this.riotAccountRepository.findOne({
      where: { puuid: riotAccountData.puuid },
    });

    if (existingPuuid && existingPuuid.userId !== userId) {
      throw new ConflictException({
        statusCode: 409,
        code: 'RIOT_ACCOUNT_TAKEN',
        message: 'This Riot account is already linked to another user',
      });
    }

    // Link or update the account in a transaction
    await this.dataSource.transaction(async (manager) => {
      if (isUpdate) {
        // Delete old account
        await manager.getRepository(RiotAccount).delete({ userId });
      }

      // Insert new account
      const riotAccount = manager.getRepository(RiotAccount).create({
        userId,
        puuid: riotAccountData.puuid,
        gameName: riotAccountData.gameName,
        tagLine: riotAccountData.tagLine,
        region: 'LA1',
        isVerified: true,
        verifiedAt: new Date(),
      });

      await manager.getRepository(RiotAccount).save(riotAccount);

      // Update user's hasRiotAccount flag
      await manager.getRepository(User).update(userId, {
        hasRiotAccount: true,
      });
    });

    return {
      puuid: riotAccountData.puuid,
      gameName: riotAccountData.gameName,
      tagLine: riotAccountData.tagLine,
      region: 'LA1',
      isVerified: true,
    };
  }
}
