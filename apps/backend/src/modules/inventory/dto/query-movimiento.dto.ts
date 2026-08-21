import {
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMovimientoDto {
  @ApiPropertyOptional({ description: 'Filtrar por libro' })
  @IsOptional()
  @IsUUID()
  libroId?: string;

  @ApiPropertyOptional({ enum: ['entrada', 'salida', 'ajuste'] })
  @IsOptional()
  @IsIn(['entrada', 'salida', 'ajuste'])
  tipo?: 'entrada' | 'salida' | 'ajuste';

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
