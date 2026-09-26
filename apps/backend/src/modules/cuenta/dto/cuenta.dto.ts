import { ContrasenaSegura } from '@common/validation/contrasena-segura';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdatePerfilDto {
  @ApiPropertyOptional({ example: 'María López' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ example: 'maria@ejemplo.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
}

export class CambiarPasswordClienteDto {
  @ApiProperty()
  @IsString()
  passwordActual!: string;

  @ApiProperty({ minLength: 8 })
  @ContrasenaSegura()
  passwordNueva!: string;
}
