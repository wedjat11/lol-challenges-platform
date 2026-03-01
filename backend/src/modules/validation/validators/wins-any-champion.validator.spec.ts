import { Test, TestingModule } from '@nestjs/testing';
import { WinsAnyChampionValidator } from './wins-any-champion.validator';
import { RiotMatch } from '@/modules/riot/riot.service';
import { ValidationContext } from '../interfaces/validator.interface';

describe('WinsAnyChampionValidator', () => {
  let validator: WinsAnyChampionValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinsAnyChampionValidator],
    }).compile();

    validator = module.get<WinsAnyChampionValidator>(WinsAnyChampionValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('should have correct validator key', () => {
    expect(validator.validatorKey).toBe('wins_any_champion');
  });

  describe('evaluate', () => {
    const mockContext: ValidationContext = {
      challengeId: 'challenge-123',
      creatorId: 'creator-123',
      targetId: 'target-123',
      targetPuuid: 'target-puuid',
      acceptedAt: new Date(),
      rewardAmount: 10,
    };

    const createMockMatch = (puuid: string, win: boolean): RiotMatch => ({
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
            championName: 'Ahri',
            championId: 84,
            win,
            kills: 5,
            deaths: 2,
            assists: 10,
          },
        ],
      },
    });

    it('should pass when required wins are met', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, true),
        createMockMatch(mockContext.targetPuuid, true),
      ];

      const result = validator.evaluate(matches, { games: 2 }, mockContext);

      expect(result.passed).toBe(true);
      expect(result.matchesQualified).toBe(2);
      expect(result.matchesEvaluated).toBe(2);
      expect(result.reason).toContain('Completed');
    });

    it('should fail when required wins not met', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, false),
        createMockMatch(mockContext.targetPuuid, false),
      ];

      const result = validator.evaluate(matches, { games: 5 }, mockContext);

      expect(result.passed).toBe(false);
      expect(result.matchesQualified).toBe(0);
      expect(result.reason).toContain('Progress');
    });

    it('should count only wins', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, true),
        createMockMatch(mockContext.targetPuuid, false),
        createMockMatch(mockContext.targetPuuid, true),
        createMockMatch(mockContext.targetPuuid, false),
      ];

      const result = validator.evaluate(matches, { games: 2 }, mockContext);

      expect(result.passed).toBe(true);
      expect(result.matchesQualified).toBe(2);
    });

    it('should stop evaluating after reaching required wins', () => {
      const matches = [
        createMockMatch(mockContext.targetPuuid, true),
        createMockMatch(mockContext.targetPuuid, true),
        createMockMatch(mockContext.targetPuuid, true),
        createMockMatch(mockContext.targetPuuid, true),
      ];

      const result = validator.evaluate(matches, { games: 2 }, mockContext);

      expect(result.passed).toBe(true);
      expect(result.matchesEvaluated).toBe(4); // All 4 matches evaluated
      expect(result.matchesQualified).toBe(2); // But only 2 wins before stopping
    });

    it('should use default games = 1 when not provided', () => {
      const matches = [createMockMatch(mockContext.targetPuuid, true)];

      const result = validator.evaluate(matches, {}, mockContext);

      expect(result.passed).toBe(true);
      expect(result.matchesQualified).toBe(1);
    });

    it('should include snapshot with win details', () => {
      const matches = [createMockMatch(mockContext.targetPuuid, true)];

      const result = validator.evaluate(matches, { games: 1 }, mockContext);

      expect(result.snapshot).toBeDefined();
      expect('winDetails' in result.snapshot).toBe(true);
    });

    it('should handle empty match list', () => {
      const result = validator.evaluate([], { games: 1 }, mockContext);

      expect(result.passed).toBe(false);
      expect(result.matchesQualified).toBe(0);
      expect(result.matchesEvaluated).toBe(0);
    });
  });
});
