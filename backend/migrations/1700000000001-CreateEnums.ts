import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnums1700000000001 implements MigrationInterface {
  name = 'CreateEnums1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE auth_provider AS ENUM ('EMAIL', 'GOOGLE');
    `);

    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
    `);

    await queryRunner.query(`
      CREATE TYPE challenge_status AS ENUM (
        'PENDING_ACCEPTANCE', 'ACTIVE', 'COMPLETED',
        'FAILED', 'EXPIRED', 'CANCELLED'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE coin_tx_type AS ENUM (
        'CHALLENGE_CREATED', 'CHALLENGE_COMPLETED', 'CHALLENGE_CANCELLED',
        'SIGNUP_BONUS', 'ADMIN_GRANT', 'ADMIN_DEDUCT'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE validation_result AS ENUM ('PASS', 'FAIL', 'ERROR', 'DEFERRED');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE IF EXISTS validation_result;`);
    await queryRunner.query(`DROP TYPE IF EXISTS coin_tx_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS challenge_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role;`);
    await queryRunner.query(`DROP TYPE IF EXISTS auth_provider;`);
  }
}
