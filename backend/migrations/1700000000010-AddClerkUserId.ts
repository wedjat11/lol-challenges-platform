import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClerkUserId1700000000010 implements MigrationInterface {
  name = 'AddClerkUserId1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN clerk_user_id VARCHAR(255) NULL,
      ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_clerk_user_id_unique,
      DROP COLUMN IF EXISTS clerk_user_id;
    `);
  }
}
