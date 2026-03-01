import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CoinTransaction } from './entities';
import { User } from '@/modules/users/entities';
import { CoinTxType } from '@/common/enums';
import { EconomyConfig } from '@/config';

@Injectable()
export class EconomyService {
  constructor(
    @InjectRepository(CoinTransaction)
    private readonly coinTransactionRepository: Repository<CoinTransaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.balance ?? 0;
  }

  async getTransactions(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ transactions: CoinTransaction[]; total: number }> {
    const [transactions, total] = await this.coinTransactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { transactions, total };
  }

  async grantSignupBonus(userId: string): Promise<void> {
    const economyConfig = this.configService.get<EconomyConfig>('economy');
    if (!economyConfig) {
      throw new Error('Economy configuration not found');
    }

    const bonusAmount = economyConfig.signupBonusCoins;

    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.id = :id', { id: userId })
        .setLock('pessimistic_write')
        .getOneOrFail();

      const newBalance = user.balance + bonusAmount;

      await manager.getRepository(User).update(userId, {
        balance: newBalance,
      });

      await manager.getRepository(CoinTransaction).insert({
        userId,
        amount: bonusAmount,
        type: CoinTxType.SIGNUP_BONUS,
        balanceAfter: newBalance,
        notes: 'Welcome bonus for new user',
      });
    });
  }

  async deductForChallengeCreation(userId: string, challengeId: string): Promise<void> {
    const economyConfig = this.configService.get<EconomyConfig>('economy');
    if (!economyConfig) {
      throw new Error('Economy configuration not found');
    }

    const cost = economyConfig.challengeCreationCost;

    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.id = :id', { id: userId })
        .setLock('pessimistic_write')
        .getOneOrFail();

      if (user.balance < cost) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          code: 'INSUFFICIENT_FUNDS',
          message: `Insufficient balance. You have ${user.balance} coins, need ${cost}.`,
        });
      }

      const newBalance = user.balance - cost;

      await manager.getRepository(User).update(userId, {
        balance: newBalance,
      });

      await manager.getRepository(CoinTransaction).insert({
        userId,
        amount: -cost,
        type: CoinTxType.CHALLENGE_CREATED,
        referenceId: challengeId,
        referenceType: 'challenge',
        balanceAfter: newBalance,
      });
    });
  }

  async creditForChallengeCompletion(
    userId: string,
    challengeId: string,
    amount: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.id = :id', { id: userId })
        .setLock('pessimistic_write')
        .getOneOrFail();

      const newBalance = user.balance + amount;

      await manager.getRepository(User).update(userId, {
        balance: newBalance,
      });

      await manager.getRepository(CoinTransaction).insert({
        userId,
        amount,
        type: CoinTxType.CHALLENGE_COMPLETED,
        referenceId: challengeId,
        referenceType: 'challenge',
        balanceAfter: newBalance,
      });
    });
  }

  async refundChallengeCancellation(userId: string, challengeId: string): Promise<void> {
    const economyConfig = this.configService.get<EconomyConfig>('economy');
    if (!economyConfig) {
      throw new Error('Economy configuration not found');
    }

    const refundAmount = economyConfig.challengeCreationCost;

    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.id = :id', { id: userId })
        .setLock('pessimistic_write')
        .getOneOrFail();

      const newBalance = user.balance + refundAmount;

      await manager.getRepository(User).update(userId, {
        balance: newBalance,
      });

      await manager.getRepository(CoinTransaction).insert({
        userId,
        amount: refundAmount,
        type: CoinTxType.CHALLENGE_CANCELLED,
        referenceId: challengeId,
        referenceType: 'challenge',
        balanceAfter: newBalance,
        notes: 'Refund for cancelled challenge',
      });
    });
  }

  async adminGrant(adminId: string, userId: string, amount: number, notes?: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.id = :id', { id: userId })
        .setLock('pessimistic_write')
        .getOneOrFail();

      const newBalance = user.balance + amount;

      await manager.getRepository(User).update(userId, {
        balance: newBalance,
      });

      await manager.getRepository(CoinTransaction).insert({
        userId,
        amount,
        type: CoinTxType.ADMIN_GRANT,
        balanceAfter: newBalance,
        notes: notes ?? `Granted by admin ${adminId}`,
      });
    });
  }

  async adminDeduct(
    adminId: string,
    userId: string,
    amount: number,
    notes?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.id = :id', { id: userId })
        .setLock('pessimistic_write')
        .getOneOrFail();

      if (user.balance < amount) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          code: 'INSUFFICIENT_FUNDS',
          message: `User has insufficient balance. Has ${user.balance}, trying to deduct ${amount}.`,
        });
      }

      const newBalance = user.balance - amount;

      await manager.getRepository(User).update(userId, {
        balance: newBalance,
      });

      await manager.getRepository(CoinTransaction).insert({
        userId,
        amount: -amount,
        type: CoinTxType.ADMIN_DEDUCT,
        balanceAfter: newBalance,
        notes: notes ?? `Deducted by admin ${adminId}`,
      });
    });
  }
}
