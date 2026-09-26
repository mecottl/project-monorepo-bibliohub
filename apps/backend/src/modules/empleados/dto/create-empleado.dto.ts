import { ContrasenaSegura } from '@common/validation/contrasena-segura';
import { IsString, IsIn, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpleadoDto {
  @ApiProperty({ example: 'María López' })
  @IsString()
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ example: 'mlopez' })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  usuario!: string;

  @ApiProperty({ example: 'contraseña123', minLength: 8 })
  @ContrasenaSegura()
  password!: string;

  @ApiProperty({ example: 'cajero', enum: ['cajero', 'admin'] })
  @IsIn(['cajero', 'admin'])
  rol!: 'cajero' | 'admin';
}
