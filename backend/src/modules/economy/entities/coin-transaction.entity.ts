import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CoinTxType } from '@/common/enums';
import { User } from '@/modules/users/entities/user.entity';

@Entity('coin_transactions')
export class CoinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'enum', enum: CoinTxType })
  type: CoinTxType;

  @Column({ type: 'uuid', nullable: true, name: 'reference_id' })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'reference_type' })
  referenceType: string | null;

  @Column({ type: 'int', name: 'balance_after' })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.coinTransactions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
