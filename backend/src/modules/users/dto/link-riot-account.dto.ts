import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LinkRiotAccountDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  gameName: string;

  @IsString()
  @Matches(/^[A-Za-z0-9]{2,5}$/, {
    message: 'Tag line must be 2-5 alphanumeric characters',
  })
  tagLine: string;
}
