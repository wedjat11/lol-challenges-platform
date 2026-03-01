import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { AuthProvider, UserRole } from '@/common/enums';
import { RiotAccount } from './riot-account.entity';
import { CoinTransaction } from '@/modules/economy/entities/coin-transaction.entity';
import { Challenge } from '@/modules/challenges/entities/challenge.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_hash' })
  passwordHash: string | null;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.EMAIL,
    name: 'auth_provider',
  })
  authProvider: AuthProvider;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, name: 'google_id' })
  googleId: string | null;

  @Column({ type: 'int', default: 0 })
  balance: number;

  @Column({ type: 'boolean', default: false, name: 'has_riot_account' })
  hasRiotAccount: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => RiotAccount, (riotAccount) => riotAccount.user)
  riotAccount: RiotAccount;

  @OneToMany(() => CoinTransaction, (transaction) => transaction.user)
  coinTransactions: CoinTransaction[];

  @OneToMany(() => Challenge, (challenge) => challenge.creator)
  createdChallenges: Challenge[];

  @OneToMany(() => Challenge, (challenge) => challenge.target)
  receivedChallenges: Challenge[];
}
