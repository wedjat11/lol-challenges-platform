import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000000002 implements MigrationInterface {
  name = 'CreateUsers1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        username         VARCHAR(50)  NOT NULL,
        email            VARCHAR(255) NOT NULL,
        password_hash    VARCHAR(255) NULL,
        auth_provider    auth_provider NOT NULL DEFAULT 'EMAIL',
        google_id        VARCHAR(255) NULL,
        balance          INTEGER      NOT NULL DEFAULT 0,
        has_riot_account BOOLEAN      NOT NULL DEFAULT false,
        role             user_role    NOT NULL DEFAULT 'USER',
        is_active        BOOLEAN      NOT NULL DEFAULT true,
        created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

        CONSTRAINT users_email_unique    UNIQUE (email),
        CONSTRAINT users_username_unique UNIQUE (username),
        CONSTRAINT users_google_unique   UNIQUE (google_id),
        CONSTRAINT users_balance_non_neg CHECK (balance >= 0),
        CONSTRAINT users_google_id_required
          CHECK (auth_provider != 'GOOGLE' OR google_id IS NOT NULL)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
