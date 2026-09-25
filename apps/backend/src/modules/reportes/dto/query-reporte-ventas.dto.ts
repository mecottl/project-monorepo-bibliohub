import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryReporteVentasDto {
  @ApiPropertyOptional({ example: '2026-09-01', description: 'Por defecto, 30 días atrás' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'Por defecto, hoy' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
