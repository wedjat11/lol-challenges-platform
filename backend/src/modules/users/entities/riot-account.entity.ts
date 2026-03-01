import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('riot_accounts')
export class RiotAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 78, unique: true })
  puuid: string;

  @Column({ type: 'varchar', length: 50, name: 'game_name' })
  gameName: string;

  @Column({ type: 'varchar', length: 10, name: 'tag_line' })
  tagLine: string;

  @Column({ type: 'varchar', length: 10 })
  region: string;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'verified_at' })
  verifiedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.riotAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
