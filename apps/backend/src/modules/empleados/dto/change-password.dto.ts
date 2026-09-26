import { ContrasenaSegura } from '@common/validation/contrasena-segura';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'contraseñaActual123' })
  @IsString()
  passwordActual!: string;

  @ApiProperty({ example: 'contraseñaNueva123', minLength: 8 })
  @ContrasenaSegura()
  passwordNueva!: string;
}
