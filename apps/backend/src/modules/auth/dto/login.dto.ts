import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  identificador!: string;

  @IsString()
  @MinLength(4)
  password!: string;
}
