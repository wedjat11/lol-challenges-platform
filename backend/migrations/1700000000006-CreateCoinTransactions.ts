import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoinTransactions1700000000006 implements MigrationInterface {
  name = 'CreateCoinTransactions1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE coin_transactions (
        id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        UUID         NOT NULL REFERENCES users(id),
        amount         INTEGER      NOT NULL,
        type           coin_tx_type NOT NULL,
        reference_id   UUID         NULL,
        reference_type VARCHAR(50)  NULL,
        balance_after  INTEGER      NOT NULL,
        notes          TEXT         NULL,
        created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

        CONSTRAINT cointx_amount_nonzero         CHECK (amount != 0),
        CONSTRAINT cointx_balance_after_non_neg  CHECK (balance_after >= 0),
        CONSTRAINT cointx_reference_consistency
          CHECK (
            (reference_id IS NULL AND reference_type IS NULL) OR
            (reference_id IS NOT NULL AND reference_type IS NOT NULL)
          )
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS coin_transactions;`);
  }
}
