import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChallengeValidationLogs1700000000007 implements MigrationInterface {
  name = 'CreateChallengeValidationLogs1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE challenge_validation_logs (
        id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
        challenge_id      UUID              NOT NULL REFERENCES challenges(id),
        triggered_by      UUID              NOT NULL REFERENCES users(id),
        result            validation_result NOT NULL,
        reason            TEXT              NULL,
        matches_evaluated INTEGER           NOT NULL DEFAULT 0,
        matches_qualified INTEGER           NOT NULL DEFAULT 0,
        riot_api_snapshot JSONB             NULL,
        created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),

        CONSTRAINT vallogs_matches_qualified_lte_evaluated
          CHECK (matches_qualified <= matches_evaluated)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS challenge_validation_logs;`);
  }
}
