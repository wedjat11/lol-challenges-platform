import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileIconId1700000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE riot_accounts
        ADD COLUMN IF NOT EXISTS profile_icon_id INT NULL,
        ADD COLUMN IF NOT EXISTS summoner_level  INT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE riot_accounts
        DROP COLUMN IF EXISTS profile_icon_id,
        DROP COLUMN IF EXISTS summoner_level
    `);
  }
}
