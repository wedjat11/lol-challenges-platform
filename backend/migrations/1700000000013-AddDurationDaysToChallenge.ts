import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds duration_days to challenges table.
 * The expiry countdown starts when the challenge is ACCEPTED, not created.
 * At creation time we store the number of days; expiresAt is computed on accept.
 *
 * Minimum days rules (enforced by backend):
 *   1–5 games required  → 7 days minimum  (1 week)
 *   6+ games required   → 14 days minimum (2 weeks)
 * Allowed values: 7 | 14 | 21 | 28
 */
export class AddDurationDaysToChallenge1700000000013 implements MigrationInterface {
  name = 'AddDurationDaysToChallenge1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE challenges
      ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 7
        CONSTRAINT challenges_duration_days_valid CHECK (duration_days IN (7, 14, 21, 28));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE challenges DROP COLUMN IF EXISTS duration_days;
    `);
  }
}
