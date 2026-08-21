import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  Matches,
} from 'class-validator';

export class RegistroClienteDto {
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'El teléfono debe contener solo dígitos (10)',
  })
  telefono!: string;

  @IsString()
  @MinLength(4)
  password!: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
