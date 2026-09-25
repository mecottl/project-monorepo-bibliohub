import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'contraseñaActual123' })
  @IsString()
  passwordActual!: string;

  @ApiProperty({ example: 'contraseñaNueva123', minLength: 8 })
  @IsString()
  @MinLength(8)
  passwordNueva!: string;
}
