import { IsString, IsObject, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsObject()
  paramSchema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  rewardFormula?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
