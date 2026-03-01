import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ValidationResult } from '@/common/enums';
import { User } from '@/modules/users/entities/user.entity';
import { Challenge } from './challenge.entity';

@Entity('challenge_validation_logs')
export class ChallengeValidationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'challenge_id' })
  challengeId: string;

  @Column({ type: 'uuid', name: 'triggered_by' })
  triggeredBy: string;

  @Column({ type: 'enum', enum: ValidationResult })
  result: ValidationResult;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'int', default: 0, name: 'matches_evaluated' })
  matchesEvaluated: number;

  @Column({ type: 'int', default: 0, name: 'matches_qualified' })
  matchesQualified: number;

  @Column({ type: 'jsonb', nullable: true, name: 'riot_api_snapshot' })
  riotApiSnapshot: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Challenge, (challenge) => challenge.validationLogs)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'triggered_by' })
  triggeredByUser: User;
}
