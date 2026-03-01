import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndexes1700000000008 implements MigrationInterface {
  name = 'CreateIndexes1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users indexes
    await queryRunner.query(`CREATE INDEX idx_users_email ON users(email);`);
    await queryRunner.query(`CREATE INDEX idx_users_username ON users(LOWER(username));`);
    await queryRunner.query(
      `CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;`,
    );
    await queryRunner.query(`CREATE INDEX idx_users_is_active ON users(is_active);`);

    // Riot accounts indexes
    await queryRunner.query(`CREATE INDEX idx_riot_accounts_user_id ON riot_accounts(user_id);`);
    await queryRunner.query(`CREATE INDEX idx_riot_accounts_puuid ON riot_accounts(puuid);`);
    await queryRunner.query(
      `CREATE INDEX idx_riot_accounts_game_name ON riot_accounts(LOWER(game_name));`,
    );

    // Challenges indexes
    await queryRunner.query(`CREATE INDEX idx_challenges_creator_id ON challenges(creator_id);`);
    await queryRunner.query(`CREATE INDEX idx_challenges_target_id ON challenges(target_id);`);
    await queryRunner.query(`CREATE INDEX idx_challenges_status ON challenges(status);`);
    await queryRunner.query(
      `CREATE INDEX idx_challenges_created_at ON challenges(created_at DESC);`,
    );
    await queryRunner.query(`
      CREATE INDEX idx_challenges_creator_status
      ON challenges(creator_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_challenges_target_status
      ON challenges(target_id, status);
    `);

    // Coin transactions indexes
    await queryRunner.query(`CREATE INDEX idx_cointx_user_id ON coin_transactions(user_id);`);
    await queryRunner.query(
      `CREATE INDEX idx_cointx_created_at ON coin_transactions(created_at DESC);`,
    );
    await queryRunner.query(`
      CREATE INDEX idx_cointx_user_created
      ON coin_transactions(user_id, created_at DESC);
    `);

    // Challenge validation logs indexes
    await queryRunner.query(
      `CREATE INDEX idx_vallogs_challenge_id ON challenge_validation_logs(challenge_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_vallogs_created_at ON challenge_validation_logs(created_at DESC);`,
    );
    await queryRunner.query(`
      CREATE INDEX idx_vallogs_challenge_created
      ON challenge_validation_logs(challenge_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop validation logs indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vallogs_challenge_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vallogs_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vallogs_challenge_id;`);

    // Drop coin transactions indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cointx_user_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cointx_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cointx_user_id;`);

    // Drop challenges indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_challenges_target_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_challenges_creator_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_challenges_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_challenges_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_challenges_target_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_challenges_creator_id;`);

    // Drop riot accounts indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_riot_accounts_game_name;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_riot_accounts_puuid;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_riot_accounts_user_id;`);

    // Drop users indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_google_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_username;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email;`);
  }
}
