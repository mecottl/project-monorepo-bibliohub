import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecuperarPasswordDto {
  @ApiProperty({ example: 'correo@ejemplo.com', description: 'Email o teléfono de la cuenta' })
  @IsString()
  @IsNotEmpty()
  identificador!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 4 })
  @IsString()
  @MinLength(4)
  password!: string;
}
