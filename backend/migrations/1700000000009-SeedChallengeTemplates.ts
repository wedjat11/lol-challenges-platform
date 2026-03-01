import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedChallengeTemplates1700000000009 implements MigrationInterface {
  name = 'SeedChallengeTemplates1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO challenge_templates (name, description, validator_key, param_schema, reward_formula) VALUES
      (
        'Win Games',
        'Win a specified number of games with any champion',
        'wins_any_champion',
        '{"type": "object", "properties": {"games": {"type": "integer", "minimum": 1, "maximum": 20}}, "required": ["games"]}',
        'games * 2'
      ),
      (
        'Win with Champion',
        'Win games playing a specific champion',
        'wins_with_champion',
        '{"type": "object", "properties": {"games": {"type": "integer", "minimum": 1, "maximum": 20}, "champion": {"type": "string"}}, "required": ["games", "champion"]}',
        'games * 3'
      ),
      (
        'Accumulate Assists',
        'Get a total number of assists across multiple games',
        'assists_accumulated',
        '{"type": "object", "properties": {"assists": {"type": "integer", "minimum": 1, "maximum": 200}, "games": {"type": "integer", "minimum": 1, "maximum": 30}}, "required": ["assists", "games"]}',
        'assists / 10'
      ),
      (
        'Assists in Single Game',
        'Get a minimum number of assists in a single game',
        'assists_single_game',
        '{"type": "object", "properties": {"assists": {"type": "integer", "minimum": 1, "maximum": 30}}, "required": ["assists"]}',
        'assists'
      ),
      (
        'Accumulate Kills',
        'Get a total number of kills across multiple games',
        'kills_accumulated',
        '{"type": "object", "properties": {"kills": {"type": "integer", "minimum": 1, "maximum": 200}, "games": {"type": "integer", "minimum": 1, "maximum": 30}}, "required": ["kills", "games"]}',
        'kills / 10'
      ),
      (
        'Kills in Single Game',
        'Get a minimum number of kills in a single game',
        'kills_single_game',
        '{"type": "object", "properties": {"kills": {"type": "integer", "minimum": 1, "maximum": 20}}, "required": ["kills"]}',
        'kills * 2'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM challenge_templates
      WHERE validator_key IN (
        'wins_any_champion',
        'wins_with_champion',
        'assists_accumulated',
        'assists_single_game',
        'kills_accumulated',
        'kills_single_game'
      );
    `);
  }
}
