import { Test, TestingModule } from '@nestjs/testing';
import { KillsAccumulatedValidator } from './kills-accumulated.validator';
import { AssistsAccumulatedValidator } from './assists-accumulated.validator';
import { KillsSingleGameValidator } from './kills-single-game.validator';
import { AssistsSingleGameValidator } from './assists-single-game.validator';
import { WinsWithChampionValidator } from './wins-with-champion.validator';
import { ValidationContext } from '../interfaces/validator.interface';
import { RiotMatch } from '@/modules/riot/riot.service';

const createMockMatch = (
  puuid: string,
  kills = 5,
  assists = 3,
  win = true,
  championName = 'Ahri',
): RiotMatch => ({
  metadata: {
    matchId: `match-${Math.random()}`,
    participants: [puuid],
  },
  info: {
    gameDuration: 1500,
    gameId: 123,
    gameStartTimestamp: Date.now() - 1500000,
    gameMode: 'CLASSIC',
    queueId: 420,
    participants: [
      {
        puuid,
        championName,
        championId: 84,
        win,
        kills,
        deaths: 2,
        assists,
      },
    ],
  },
});

const mockContext: ValidationContext = {
  challengeId: 'challenge-123',
  creatorId: 'creator-123',
  targetId: 'target-123',
  targetPuuid: 'target-puuid',
  acceptedAt: new Date(),
  rewardAmount: 10,
};

describe('Validators', () => {
  describe('KillsAccumulatedValidator', () => {
    let validator: KillsAccumulatedValidator;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [KillsAccumulatedValidator],
      }).compile();

      validator = module.get<KillsAccumulatedValidator>(KillsAccumulatedValidator);
    });

    it('should have correct validator key', () => {
      expect(validator.validatorKey).toBe('kills_accumulated');
    });

    it('should pass when accumulated kills meet requirement', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 5),
        createMockMatch(mockContext.targetPuuid, 6),
        createMockMatch(mockContext.targetPuuid, 4),
      ];

      const result = validator.evaluate(matches, { kills: 10, games: 30 }, mockContext);

      expect(result.passed).toBe(true);
      expect(result.matchesEvaluated).toBe(3);
    });

    it('should fail when accumulated kills do not meet requirement', () => {
      const matches = [createMockMatch(mockContext.targetPuuid, 3)];

      const result = validator.evaluate(matches, { kills: 50, games: 30 }, mockContext);

      expect(result.passed).toBe(false);
    });

    it('should respect max games limit', () => {
      const matches = Array(10)
        .fill(null)
        .map(() => createMockMatch(mockContext.targetPuuid, 5));

      const result = validator.evaluate(matches, { kills: 100, games: 3 }, mockContext);

      expect(result.matchesEvaluated).toBe(3);
    });
  });

  describe('AssistsAccumulatedValidator', () => {
    let validator: AssistsAccumulatedValidator;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [AssistsAccumulatedValidator],
      }).compile();

      validator = module.get<AssistsAccumulatedValidator>(AssistsAccumulatedValidator);
    });

    it('should have correct validator key', () => {
      expect(validator.validatorKey).toBe('assists_accumulated');
    });

    it('should pass when accumulated assists meet requirement', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 0, 5),
        createMockMatch(mockContext.targetPuuid, 0, 6),
      ];

      const result = validator.evaluate(matches, { assists: 10, games: 30 }, mockContext);

      expect(result.passed).toBe(true);
    });

    it('should fail when accumulated assists do not meet requirement', () => {
      const matches = [createMockMatch(mockContext.targetPuuid, 0, 2)];

      const result = validator.evaluate(matches, { assists: 50, games: 30 }, mockContext);

      expect(result.passed).toBe(false);
    });
  });

  describe('KillsSingleGameValidator', () => {
    let validator: KillsSingleGameValidator;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [KillsSingleGameValidator],
      }).compile();

      validator = module.get<KillsSingleGameValidator>(KillsSingleGameValidator);
    });

    it('should have correct validator key', () => {
      expect(validator.validatorKey).toBe('kills_single_game');
    });

    it('should pass when any single game has required kills', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 3),
        createMockMatch(mockContext.targetPuuid, 15),
        createMockMatch(mockContext.targetPuuid, 2),
      ];

      const result = validator.evaluate(matches, { kills: 10 }, mockContext);

      expect(result.passed).toBe(true);
      expect(result.matchesQualified).toBeGreaterThanOrEqual(1);
    });

    it('should fail when no single game has required kills', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 3),
        createMockMatch(mockContext.targetPuuid, 5),
      ];

      const result = validator.evaluate(matches, { kills: 10 }, mockContext);

      expect(result.passed).toBe(false);
    });
  });

  describe('AssistsSingleGameValidator', () => {
    let validator: AssistsSingleGameValidator;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [AssistsSingleGameValidator],
      }).compile();

      validator = module.get<AssistsSingleGameValidator>(AssistsSingleGameValidator);
    });

    it('should have correct validator key', () => {
      expect(validator.validatorKey).toBe('assists_single_game');
    });

    it('should pass when any single game has required assists', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 0, 2),
        createMockMatch(mockContext.targetPuuid, 0, 15),
        createMockMatch(mockContext.targetPuuid, 0, 1),
      ];

      const result = validator.evaluate(matches, { assists: 10 }, mockContext);

      expect(result.passed).toBe(true);
    });

    it('should fail when no single game has required assists', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 0, 3),
        createMockMatch(mockContext.targetPuuid, 0, 5),
      ];

      const result = validator.evaluate(matches, { assists: 10 }, mockContext);

      expect(result.passed).toBe(false);
    });
  });

  describe('WinsWithChampionValidator', () => {
    let validator: WinsWithChampionValidator;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [WinsWithChampionValidator],
      }).compile();

      validator = module.get<WinsWithChampionValidator>(WinsWithChampionValidator);
    });

    it('should have correct validator key', () => {
      expect(validator.validatorKey).toBe('wins_with_champion');
    });

    it('should pass when required wins with champion are met', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 0, 0, true, 'Ahri'),
        createMockMatch(mockContext.targetPuuid, 0, 0, true, 'Ahri'),
        createMockMatch(mockContext.targetPuuid, 0, 0, false, 'Lux'),
      ];

      const result = validator.evaluate(matches, { champion: 'ahri', games: 20 }, mockContext);

      expect(result.passed).toBe(true);
      expect(result.matchesQualified).toBeGreaterThanOrEqual(2);
    });

    it('should fail when required wins with champion not met', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 0, 0, true, 'Ahri'),
        createMockMatch(mockContext.targetPuuid, 0, 0, false, 'Lux'),
      ];

      const result = validator.evaluate(matches, { champion: 'ahri', games: 20 }, mockContext);

      expect(result.passed).toBe(false);
    });

    it('should be case insensitive for champion names', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 0, 0, true, 'Ahri'),
        createMockMatch(mockContext.targetPuuid, 0, 0, true, 'AHRI'),
      ];

      const result = validator.evaluate(matches, { champion: 'ahri', games: 20 }, mockContext);

      expect(result.passed).toBe(true);
    });

    it('should count only wins with the specified champion', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, 0, 0, true, 'Ahri'),
        createMockMatch(mockContext.targetPuuid, 0, 0, true, 'Lux'),
        createMockMatch(mockContext.targetPuuid, 0, 0, true, 'Ahri'),
      ];

      const result = validator.evaluate(matches, { champion: 'ahri', games: 20 }, mockContext);

      expect(result.matchesQualified).toBe(2);
    });
  });
});
