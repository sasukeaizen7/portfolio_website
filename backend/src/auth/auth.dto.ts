import { IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(200)
  email: string;

  @IsString()
  @MaxLength(200)
  password: string;
}
