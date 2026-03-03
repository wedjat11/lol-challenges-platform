import { IsUUID, IsObject, IsOptional, IsDateString } from 'class-validator';

export class CreateChallengeDto {
  @IsUUID()
  targetId: string;

  @IsUUID()
  templateId: string;

  @IsObject()
  params: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
