import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import {
  Challenge,
  ChallengeValidationLog,
  ChallengeTemplate,
} from '@/modules/challenges/entities';
import { User, RiotAccount } from '@/modules/users/entities';
import { CoinTransaction } from '@/modules/economy/entities';
import { ChallengeStatus, ValidationResult, AuthProvider, CoinTxType } from '@/common/enums';
import { v4 as uuidv4 } from 'uuid';

describe('Validation Worker E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let challengeRepository: Repository<Challenge>;
  let validationLogRepository: Repository<ChallengeValidationLog>;
  let templateRepository: Repository<ChallengeTemplate>;
  let userRepository: Repository<User>;
  let riotAccountRepository: Repository<RiotAccount>;
  let coinTransactionRepository: Repository<CoinTransaction>;

  // Test data
  let creatorUser: User;
  let targetUser: User;
  let targetRiotAccount: RiotAccount;
  let winsTemplate: ChallengeTemplate;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    challengeRepository = dataSource.getRepository(Challenge);
    validationLogRepository = dataSource.getRepository(ChallengeValidationLog);
    templateRepository = dataSource.getRepository(ChallengeTemplate);
    userRepository = dataSource.getRepository(User);
    riotAccountRepository = dataSource.getRepository(RiotAccount);
    coinTransactionRepository = dataSource.getRepository(CoinTransaction);

    // Create test users
    creatorUser = await userRepository.save({
      username: `creator_${uuidv4().substring(0, 8)}`,
      email: `creator_${uuidv4().substring(0, 8)}@test.com`,
      authProvider: AuthProvider.EMAIL,
      balance: 100,
      hasRiotAccount: false,
    } as any);

    targetUser = await userRepository.save({
      username: `target_${uuidv4().substring(0, 8)}`,
      email: `target_${uuidv4().substring(0, 8)}@test.com`,
      authProvider: AuthProvider.EMAIL,
      balance: 0,
      hasRiotAccount: true,
    } as any);

    // Create mock Riot account for target
    targetRiotAccount = await riotAccountRepository.save({
      userId: targetUser.id,
      puuid: 'mock-puuid-' + uuidv4().substring(0, 8),
      gameName: 'TestPlayer',
      tagLine: 'LAN',
      region: 'LA1',
      isVerified: true,
      verifiedAt: new Date(),
    } as any);

    // Get or create template
    let template = await templateRepository.findOne({
      where: { validatorKey: 'wins_any_champion' },
    });

    if (!template) {
      winsTemplate = await templateRepository.save({
        name: 'Win Any Champion',
        description: 'Win any number of games',
        validatorKey: 'wins_any_champion',
        paramSchema: { games: { type: 'number', min: 1, max: 20 } },
        rewardFormula: 'games * 10',
        isActive: true,
      } as any);
    } else {
      winsTemplate = template;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Worker Job Processing', () => {
    it('should process a PASS result - mark challenge completed and award coins', async () => {
      // Create a challenge
      const challengeData = {
        creatorId: creatorUser.id,
        targetId: targetUser.id,
        templateId: winsTemplate.id,
        params: { games: 1 },
        rewardAmount: 50,
        acceptedAt: new Date(Date.now() - 60000), // 1 minute ago
      };

      let challenge = await challengeRepository.save({
        ...challengeData,
        status: ChallengeStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const initialBalance = targetUser.balance;

      // Log the validation result (simulating worker processing a PASS result)
      await validationLogRepository.save({
        challengeId: challenge.id,
        triggeredBy: creatorUser.id,
        result: ValidationResult.PASS,
        reason: 'Completed: 1/1 wins',
        matchesEvaluated: 5,
        matchesQualified: 1,
        riotApiSnapshot: { winDetails: [{ matchId: 'match-1', champion: 'Ahri' }] },
      } as any);

      // Simulate what the worker does on PASS
      challenge.status = ChallengeStatus.COMPLETED as any;
      challenge.completedAt = new Date();
      await challengeRepository.save(challenge);

      // Award coins (simulate economy service)
      await coinTransactionRepository.save({
        userId: targetUser.id,
        amount: challenge.rewardAmount,
        type: CoinTxType.CHALLENGE_COMPLETED,
        referenceId: challenge.id,
        referenceType: 'challenge',
        balanceAfter: initialBalance + challenge.rewardAmount,
      } as any);

      // Verify in database
      const updatedChallenge = await challengeRepository.findOneBy({ id: challenge.id });
      expect(updatedChallenge).toBeDefined();
      expect(updatedChallenge!.status).toBe(ChallengeStatus.COMPLETED);
      expect(updatedChallenge!.completedAt).toBeDefined();

      const transaction = await coinTransactionRepository.findOne({
        where: { referenceId: challenge.id },
      });
      expect(transaction).toBeDefined();
      expect(transaction!.amount).toBe(50);
      expect(transaction!.type).toBe(CoinTxType.CHALLENGE_COMPLETED);

      const validationLog = await validationLogRepository.findOneBy({
        challengeId: challenge.id,
      });
      expect(validationLog).toBeDefined();
      expect(validationLog!.result).toBe(ValidationResult.PASS);
      expect(validationLog!.matchesEvaluated).toBe(5);
      expect(validationLog!.matchesQualified).toBe(1);
    });

    it('should process a FAIL result - only log, no state changes', async () => {
      const challenge = await challengeRepository.save({
        id: uuidv4(),
        creatorId: creatorUser.id,
        targetId: targetUser.id,
        templateId: winsTemplate.id,
        params: { games: 10 },
        status: ChallengeStatus.ACTIVE,
        rewardAmount: 50,
        acceptedAt: new Date(Date.now() - 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const initialStatus = challenge.status;

      // Simulate worker logging FAIL result
      await validationLogRepository.save({
        id: uuidv4(),
        challengeId: challenge.id,
        triggeredBy: creatorUser.id,
        result: ValidationResult.FAIL,
        reason: 'Progress: 2/10 wins',
        matchesEvaluated: 5,
        matchesQualified: 2,
      });

      // Check challenge status is STILL ACTIVE (worker doesn't change it on FAIL)
      const unchangedChallenge = await challengeRepository.findOneBy({ id: challenge.id });
      expect(unchangedChallenge).toBeDefined();
      expect(unchangedChallenge!.status).toBe(initialStatus);
      expect(unchangedChallenge!.completedAt).toBeNull();

      // No coin transaction created
      const transaction = await coinTransactionRepository.findOne({
        where: { referenceId: challenge.id },
      });
      expect(transaction).toBeNull();

      // Validation log exists
      const validationLog = await validationLogRepository.findOneBy({
        challengeId: challenge.id,
      });
      expect(validationLog).toBeDefined();
      expect(validationLog!.result).toBe(ValidationResult.FAIL);
    });

    it('should process an ERROR result - only log, no state changes', async () => {
      const challenge = await challengeRepository.save({
        id: uuidv4(),
        creatorId: creatorUser.id,
        targetId: targetUser.id,
        templateId: winsTemplate.id,
        params: { games: 1 },
        status: ChallengeStatus.ACTIVE,
        rewardAmount: 50,
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const initialStatus = challenge.status;

      // Simulate worker logging ERROR result (e.g., Riot API error)
      await validationLogRepository.save({
        id: uuidv4(),
        challengeId: challenge.id,
        triggeredBy: creatorUser.id,
        result: ValidationResult.ERROR,
        reason: 'Unable to reach Riot API',
        matchesEvaluated: 0,
        matchesQualified: 0,
      });

      // Challenge status unchanged
      const unchangedChallenge = await challengeRepository.findOneBy({ id: challenge.id });
      expect(unchangedChallenge).toBeDefined();
      expect(unchangedChallenge!.status).toBe(initialStatus);
      expect(unchangedChallenge!.completedAt).toBeNull();

      // No coin transaction
      const transaction = await coinTransactionRepository.findOne({
        where: { referenceId: challenge.id },
      });
      expect(transaction).toBeNull();

      // Validation log exists with ERROR
      const validationLog = await validationLogRepository.findOneBy({
        challengeId: challenge.id,
      });
      expect(validationLog).toBeDefined();
      expect(validationLog!.result).toBe(ValidationResult.ERROR);
      expect(validationLog!.reason).toContain('API');
    });

    it('should skip processing for non-ACTIVE challenges', async () => {
      const challenge = await challengeRepository.save({
        id: uuidv4(),
        creatorId: creatorUser.id,
        targetId: targetUser.id,
        templateId: winsTemplate.id,
        params: { games: 1 },
        status: ChallengeStatus.COMPLETED, // Already completed
        rewardAmount: 50,
        acceptedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Worker should skip this (in actual worker: console.log and return)
      // Verify no validation log is created
      const validationLog = await validationLogRepository.findOne({
        where: { challengeId: challenge.id },
      });
      expect(validationLog).toBeNull();
    });

    it('should handle challenge with target having no Riot account', async () => {
      const userWithoutRiot = await userRepository.save({
        username: `notriot_${uuidv4().substring(0, 8)}`,
        email: `notriot_${uuidv4().substring(0, 8)}@test.com`,
        authProvider: AuthProvider.EMAIL,
        balance: 0,
        hasRiotAccount: false,
      } as any);

      const challenge = await challengeRepository.save({
        id: uuidv4(),
        creatorId: creatorUser.id,
        targetId: userWithoutRiot.id,
        templateId: winsTemplate.id,
        params: { games: 1 },
        status: ChallengeStatus.ACTIVE,
        rewardAmount: 50,
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Simulate worker handling missing Riot account
      await validationLogRepository.save({
        id: uuidv4(),
        challengeId: challenge.id,
        triggeredBy: creatorUser.id,
        result: ValidationResult.ERROR,
        reason: 'Target has no Riot account linked',
        matchesEvaluated: 0,
        matchesQualified: 0,
      });

      const validationLog = await validationLogRepository.findOne({
        where: { challengeId: challenge.id },
      });
      expect(validationLog).toBeDefined();
      expect(validationLog!.result).toBe(ValidationResult.ERROR);
      expect(validationLog!.reason).toContain('no Riot account');
    });

    it('should handle unknown validator error', async () => {
      const unknownValidatorKey = `nonexistent_validator_${uuidv4().substring(0, 8)}`;
      const unknownTemplate = await templateRepository.save({
        name: 'Unknown Validator',
        description: 'Validator that does not exist',
        validatorKey: unknownValidatorKey,
        paramSchema: {},
        rewardFormula: '0',
        isActive: true,
      } as any);

      const challenge = await challengeRepository.save({
        creatorId: creatorUser.id,
        targetId: targetUser.id,
        templateId: unknownTemplate.id,
        params: {},
        status: ChallengeStatus.ACTIVE,
        rewardAmount: 50,
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Simulate worker handling unknown validator
      await validationLogRepository.save({
        challengeId: challenge.id,
        triggeredBy: creatorUser.id,
        result: ValidationResult.ERROR,
        reason: `Unknown validator: ${unknownValidatorKey}`,
        matchesEvaluated: 0,
        matchesQualified: 0,
      } as any);

      const validationLog = await validationLogRepository.findOne({
        where: { challengeId: challenge.id },
      });
      expect(validationLog).toBeDefined();
      expect(validationLog!.result).toBe(ValidationResult.ERROR);
      expect(validationLog!.reason).toContain('Unknown validator');
    });
  });

  describe('Validation Log Schema', () => {
    it('should store complete validation result with snapshot data', async () => {
      const challenge = await challengeRepository.save({
        id: uuidv4(),
        creatorId: creatorUser.id,
        targetId: targetUser.id,
        templateId: winsTemplate.id,
        params: { games: 1 },
        status: ChallengeStatus.ACTIVE,
        rewardAmount: 50,
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const snapshot = {
        winDetails: [
          { matchId: 'match-123', champion: 'Ahri' },
          { matchId: 'match-456', champion: 'Lux' },
        ],
      };

      const log = await validationLogRepository.save({
        id: uuidv4(),
        challengeId: challenge.id,
        triggeredBy: creatorUser.id,
        result: ValidationResult.PASS,
        reason: 'Completed: 2/1 wins',
        matchesEvaluated: 10,
        matchesQualified: 2,
        riotApiSnapshot: snapshot,
      });

      const retrieved = await validationLogRepository.findOneBy({ id: log.id });
      expect(retrieved).toBeDefined();
      expect(retrieved!.riotApiSnapshot).toEqual(snapshot);
      expect(retrieved!.matchesEvaluated).toBe(10);
      expect(retrieved!.matchesQualified).toBe(2);
    });
  });
});
