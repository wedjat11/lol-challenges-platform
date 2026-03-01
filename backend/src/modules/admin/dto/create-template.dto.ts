import { IsString, IsObject, IsBoolean, MinLength } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(5)
  description: string;

  @IsString()
  validatorKey: string;

  @IsObject()
  paramSchema: Record<string, unknown>;

  @IsString()
  rewardFormula: string;

  @IsBoolean()
  isActive: boolean;
}
