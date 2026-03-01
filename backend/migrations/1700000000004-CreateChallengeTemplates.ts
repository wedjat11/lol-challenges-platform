import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChallengeTemplates1700000000004 implements MigrationInterface {
  name = 'CreateChallengeTemplates1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE challenge_templates (
        id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name           VARCHAR(100) NOT NULL,
        description    TEXT         NOT NULL,
        validator_key  VARCHAR(50)  NOT NULL,
        param_schema   JSONB        NOT NULL,
        reward_formula VARCHAR(200) NOT NULL,
        is_active      BOOLEAN      NOT NULL DEFAULT true,
        created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

        CONSTRAINT templates_validator_key_unique UNIQUE (validator_key)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS challenge_templates;`);
  }
}
