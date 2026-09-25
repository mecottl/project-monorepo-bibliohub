import { IsString, IsIn, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmpleadoDto {
  @ApiPropertyOptional({ example: 'María López' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ example: 'admin', enum: ['cajero', 'admin'] })
  @IsOptional()
  @IsIn(['cajero', 'admin'])
  rol?: 'cajero' | 'admin';

  @ApiPropertyOptional({ example: false, description: 'Desactivar/reactivar al empleado' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
