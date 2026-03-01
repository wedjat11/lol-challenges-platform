import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChallengeStatus } from '@/common/enums';
import { User } from '@/modules/users/entities/user.entity';
import { ChallengeTemplate } from './challenge-template.entity';
import { ChallengeValidationLog } from './challenge-validation-log.entity';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'creator_id' })
  creatorId: string;

  @Column({ type: 'uuid', name: 'target_id' })
  targetId: string;

  @Column({ type: 'uuid', name: 'template_id' })
  templateId: string;

  @Column({ type: 'jsonb' })
  params: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: ChallengeStatus,
    default: ChallengeStatus.PENDING_ACCEPTANCE,
  })
  status: ChallengeStatus;

  @Column({ type: 'int', name: 'reward_amount' })
  rewardAmount: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'accepted_at' })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.createdChallenges)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @ManyToOne(() => User, (user) => user.receivedChallenges)
  @JoinColumn({ name: 'target_id' })
  target: User;

  @ManyToOne(() => ChallengeTemplate, (template) => template.challenges)
  @JoinColumn({ name: 'template_id' })
  template: ChallengeTemplate;

  @OneToMany(() => ChallengeValidationLog, (log) => log.challenge)
  validationLogs: ChallengeValidationLog[];
}
