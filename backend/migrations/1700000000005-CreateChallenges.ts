import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChallenges1700000000005 implements MigrationInterface {
  name = 'CreateChallenges1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE challenges (
        id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id    UUID             NOT NULL REFERENCES users(id),
        target_id     UUID             NOT NULL REFERENCES users(id),
        template_id   UUID             NOT NULL REFERENCES challenge_templates(id),
        params        JSONB            NOT NULL,
        status        challenge_status NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
        reward_amount INTEGER          NOT NULL,
        expires_at    TIMESTAMPTZ      NULL,
        accepted_at   TIMESTAMPTZ      NULL,
        completed_at  TIMESTAMPTZ      NULL,
        created_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),

        CONSTRAINT challenges_no_self_challenge CHECK (creator_id != target_id),
        CONSTRAINT challenges_reward_positive   CHECK (reward_amount > 0),
        CONSTRAINT challenges_accepted_at_when_active
          CHECK (status = 'PENDING_ACCEPTANCE' OR status = 'CANCELLED' OR accepted_at IS NOT NULL),
        CONSTRAINT challenges_completed_at_when_done
          CHECK (status != 'COMPLETED' OR completed_at IS NOT NULL),
        CONSTRAINT challenges_expires_after_creation
          CHECK (expires_at IS NULL OR expires_at > created_at)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS challenges;`);
  }
}
