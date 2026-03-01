import { IsUUID, IsObject, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateChallengeDto {
  @IsUUID()
  targetId: string;

  @IsUUID()
  templateId: string;

  @IsObject()
  params: Record<string, unknown>;

  @IsNumber()
  @Min(1)
  rewardAmount: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
