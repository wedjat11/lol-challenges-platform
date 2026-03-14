import { IsUUID, IsObject, IsInt, IsIn } from 'class-validator';
import { ALLOWED_DURATION_DAYS } from '../utils/challenge-duration.util';

export class CreateChallengeDto {
  @IsUUID()
  targetId: string;

  @IsUUID()
  templateId: string;

  @IsObject()
  params: Record<string, unknown>;

  /**
   * Duration chosen by the creator.
   * Allowed: 7 | 14 | 21 | 28 days.
   * Minimum depends on game count in params:
   *   1–5 games → 7 days  |  6+ games → 14 days
   * The countdown starts from acceptedAt, not createdAt.
   */
  @IsInt()
  @IsIn([...ALLOWED_DURATION_DAYS])
  durationDays: number;
}
