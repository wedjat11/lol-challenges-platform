import { IsString, IsNumber, Min, MinLength } from 'class-validator';

export class DeductCoinsDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @MinLength(3)
  notes: string;
}
