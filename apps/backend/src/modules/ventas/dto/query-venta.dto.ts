import { IsOptional, IsUUID, IsIn, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryVentaDto {
  @ApiPropertyOptional({ description: 'Filtrar por cliente' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por empleado que registró la venta' })
  @IsOptional()
  @IsUUID()
  empleadoId?: string;

  @ApiPropertyOptional({ enum: ['completada', 'cancelada'] })
  @IsOptional()
  @IsIn(['completada', 'cancelada'])
  estado?: 'completada' | 'cancelada';

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
