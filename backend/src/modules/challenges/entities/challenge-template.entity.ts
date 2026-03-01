import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Challenge } from './challenge.entity';

@Entity('challenge_templates')
export class ChallengeTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'validator_key' })
  validatorKey: string;

  @Column({ type: 'jsonb', name: 'param_schema' })
  paramSchema: Record<string, unknown>;

  @Column({ type: 'varchar', length: 200, name: 'reward_formula' })
  rewardFormula: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Challenge, (challenge) => challenge.template)
  challenges: Challenge[];
}
