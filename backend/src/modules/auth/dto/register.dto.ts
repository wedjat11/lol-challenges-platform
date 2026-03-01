import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  gameName?: string;

  @ValidateIf((o) => o.gameName !== undefined)
  @IsString()
  @Matches(/^[A-Za-z0-9]{2,5}$/, {
    message: 'Tag line must be 2-5 alphanumeric characters',
  })
  tagLine?: string;
}
