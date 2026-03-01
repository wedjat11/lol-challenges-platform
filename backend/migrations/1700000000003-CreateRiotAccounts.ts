import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRiotAccounts1700000000003 implements MigrationInterface {
  name = 'CreateRiotAccounts1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE riot_accounts (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        puuid        VARCHAR(78) NOT NULL,
        game_name    VARCHAR(50) NOT NULL,
        tag_line     VARCHAR(10) NOT NULL,
        region       VARCHAR(10) NOT NULL,
        is_verified  BOOLEAN     NOT NULL DEFAULT false,
        verified_at  TIMESTAMPTZ NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT riot_accounts_user_unique  UNIQUE (user_id),
        CONSTRAINT riot_accounts_puuid_unique UNIQUE (puuid),
        CONSTRAINT riot_tag_line_format CHECK (tag_line ~ '^[A-Za-z0-9]{2,5}$'),
        CONSTRAINT riot_verified_timestamp CHECK (is_verified = false OR verified_at IS NOT NULL)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS riot_accounts;`);
  }
}
