import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Lo único que un empleado puede cambiarse a sí mismo; rol y activo solo los toca un admin.
export class UpdatePerfilEmpleadoDto {
  @ApiProperty({ example: 'María López' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre!: string;
}
