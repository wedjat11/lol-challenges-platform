import { IsBoolean, IsString, MinLength } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;

  @IsString()
  @MinLength(3)
  reason: string;
}
