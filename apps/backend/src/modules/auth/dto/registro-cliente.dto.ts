import { ContrasenaSegura } from '@common/validation/contrasena-segura';
import { IsString, IsOptional, IsEmail, Matches } from 'class-validator';

export class RegistroClienteDto {
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'El teléfono debe contener solo dígitos (10)',
  })
  telefono!: string;

  @ContrasenaSegura()
  password!: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
