import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EconomyService } from './economy.service';
import { CoinTransaction } from './entities';
import { User } from '@/modules/users/entities';
import { CoinTxType } from '@/common/enums';

describe('EconomyService', () => {
  let service: EconomyService;
  let userRepository: Repository<User>;
  let coinTransactionRepository: Repository<CoinTransaction>;
  let dataSource: DataSource;
  let configService: ConfigService;

  const mockEconomyConfig = {
    signupBonusCoins: 10,
    challengeCreationCost: 1,
    validationCooldownMinutes: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EconomyService,
        {
          provide: getRepositoryToken(CoinTransaction),
          useValue: {
            insert: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((callback) => callback({} as any)),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'economy') return mockEconomyConfig;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EconomyService>(EconomyService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    coinTransactionRepository = module.get<Repository<CoinTransaction>>(
      getRepositoryToken(CoinTransaction),
    );
    dataSource = module.get<DataSource>(DataSource);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return user balance', async () => {
      const mockUser = { id: 'user-123', balance: 100 };
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser as any);

      const balance = await service.getBalance('user-123');

      expect(balance).toBe(100);
    });

    it('should return 0 if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      const balance = await service.getBalance('nonexistent');

      expect(balance).toBe(0);
    });
  });

  describe('getTransactions', () => {
    it('should return transactions with default pagination', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          userId: 'user-123',
          amount: -1,
          type: CoinTxType.CHALLENGE_CREATED,
          balanceAfter: 99,
          createdAt: new Date(),
        },
      ];

      jest
        .spyOn(coinTransactionRepository, 'findAndCount')
        .mockResolvedValueOnce([mockTransactions, 1] as any);

      const result = await service.getTransactions('user-123');

      expect(result.transactions).toEqual(mockTransactions);
      expect(result.total).toBe(1);
    });

    it('should use custom limit and offset', async () => {
      jest.spyOn(coinTransactionRepository, 'findAndCount').mockResolvedValueOnce([[], 0] as any);

      await service.getTransactions('user-123', 10, 5);

      expect(coinTransactionRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  describe('grantSignupBonus', () => {
    it('should call transaction', async () => {
      await service.grantSignupBonus('user-123');

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw error if economy config not found', async () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce(null);

      await expect(service.grantSignupBonus('user-123')).rejects.toThrow(
        'Economy configuration not found',
      );
    });
  });

  describe('deductForChallengeCreation', () => {
    it('should call transaction', async () => {
      await service.deductForChallengeCreation('user-123', 'challenge-456');

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw error if economy config not found', async () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce(null);

      await expect(service.deductForChallengeCreation('user-123', 'challenge-456')).rejects.toThrow(
        'Economy configuration not found',
      );
    });
  });

  describe('creditForChallengeCompletion', () => {
    it('should call transaction', async () => {
      await service.creditForChallengeCompletion('user-123', 'challenge-456', 50);

      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('refundChallengeCancellation', () => {
    it('should call transaction', async () => {
      await service.refundChallengeCancellation('user-123', 'challenge-456');

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw error if economy config not found', async () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce(null);

      await expect(
        service.refundChallengeCancellation('user-123', 'challenge-456'),
      ).rejects.toThrow('Economy configuration not found');
    });
  });

  describe('adminGrant', () => {
    it('should call transaction', async () => {
      await service.adminGrant('admin-123', 'user-123', 100);

      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('adminDeduct', () => {
    it('should call transaction', async () => {
      await service.adminDeduct('admin-123', 'user-123', 50);

      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });
});
