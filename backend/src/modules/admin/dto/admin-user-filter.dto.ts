import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class AdminUserFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  hasRiotAccount?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit = 50;

  @IsOptional()
  @IsString()
  cursor?: string;
}
